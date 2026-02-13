# main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid
import json
import re
import hashlib
from typing import List, Optional

import numpy as np
import faiss
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from pypdf import PdfReader
import docx  # python-docx


# -------------------------
# App + CORS
# -------------------------
app = FastAPI(title="AI Document Q&A API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",    # ✅ Vite
        "http://127.0.0.1:5173",    # ✅ Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Folders
# -------------------------
UPLOAD_DIR = Path("data/uploads")
TEXT_DIR = Path("data/text")
CHUNK_DIR = Path("data/chunks")
INDEX_DIR = Path("data/index")

for d in [UPLOAD_DIR, TEXT_DIR, CHUNK_DIR, INDEX_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# -------------------------
# Embedding model
# -------------------------
model = SentenceTransformer("all-MiniLM-L6-v2")


# -------------------------
# Helpers: normalize/dedupe
# -------------------------
STOP = {
    "what", "is", "are", "the", "a", "an", "of", "to", "in", "and", "or", "for", "with",
    "on", "about", "this", "that", "these", "those", "please", "tell", "me", "explain",
    "give", "define", "discuss", "compare", "why", "how", "when", "where", "which"
}

def _norm(t: str) -> str:
    t = t.lower()
    t = re.sub(r"\s+", " ", t).strip()
    return t

def _hash_text(t: str) -> str:
    return hashlib.md5(_norm(t).encode("utf-8")).hexdigest()

def extract_keywords(question: str) -> List[str]:
    words = [w for w in re.findall(r"[a-zA-Z]+", question.lower()) if len(w) > 2 and w not in STOP]
    return words if words else re.findall(r"[a-zA-Z]+", question.lower())


# -------------------------
# Helpers: extract text
# -------------------------
def extract_text_from_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    full_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            full_text += txt + "\n"
    return full_text.strip()

def extract_text_from_docx(path: Path) -> str:
    d = docx.Document(str(path))
    return "\n".join([p.text for p in d.paragraphs if p.text.strip()]).strip()

def extract_text_from_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore").strip()


# -------------------------
# Helpers: chunking + IO
# -------------------------
def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150) -> List[str]:
    text = text.replace("\r", "\n")
    chunks = []
    start = 0
    n = len(text)

    while start < n:
        end = min(start + chunk_size, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end == n:
            break
        start = max(0, end - overlap)

    return chunks

def load_chunks(doc_id: str) -> List[str]:
    chunks_path = CHUNK_DIR / f"{doc_id}.json"
    return json.loads(chunks_path.read_text(encoding="utf-8"))

def load_faiss_index(doc_id: str):
    index_path = INDEX_DIR / f"{doc_id}.faiss"
    return faiss.read_index(str(index_path))


# -------------------------
# Answer builders (no LLM)
# -------------------------
def is_summary_question(q: str) -> bool:
    q = q.lower().strip()
    patterns = [
        "what is this document about",
        "what does this document cover",
        "what covers",
        "summary",
        "overview",
        "document about",
        "summarize",
        "give summary",
        "tell me about this document",
    ]
    return any(p in q for p in patterns)

def sentence_level_answer(question: str, contexts: List[str], max_points: int = 5) -> str:
    q_words = extract_keywords(question)
    scored = []

    for ctx in contexts:
        # split into sentences
        sents = re.split(r"(?<=[.!?])\s+", ctx.strip())
        for s in sents:
            s = s.strip()
            if len(s) < 25:
                continue
            s_low = s.lower()

            score = sum(1 for w in q_words if w in s_low)

            # small bonus if it looks like a definition / structured answer
            if ":" in s[:50]:
                score += 1

            if score > 0:
                scored.append((score, s))

    scored.sort(key=lambda x: x[0], reverse=True)

    picked = []
    seen = set()
    for score, s in scored:
        key = _norm(s)
        if key in seen:
            continue
        seen.add(key)
        picked.append(s)
        if len(picked) >= max_points:
            break

    if not picked:
        return (
            "I couldn’t find a direct answer for this question in the document.\n"
            "Try asking with more specific keywords (topic/heading/term)."
        )

    return "• " + "\n• ".join(picked)

def summarize_document(contexts: List[str], max_points: int = 5) -> str:
    # Grab clean lines from the most relevant chunks
    lines = []
    for ctx in contexts[:8]:
        for ln in ctx.splitlines():
            ln = ln.strip()
            if 10 <= len(ln) <= 120:
                lines.append(ln)

    # dedupe lines
    uniq = []
    seen = set()
    for ln in lines:
        key = _norm(ln)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(ln)

    if not uniq:
        return "This document has multiple sections. Ask a specific topic/heading for a precise answer."

    # Keep top bullets
    return "• " + "\n• ".join(uniq[:max_points])

def diversify_contexts(question: str, contexts: List[str], max_keep: int) -> List[str]:
    # Prefer chunks containing more question keywords; avoid duplicates
    q_words = extract_keywords(question)
    ranked = []

    for txt in contexts:
        t_low = txt.lower()
        score = sum(1 for w in q_words if w in t_low)
        ranked.append((score, txt))

    ranked.sort(key=lambda x: x[0], reverse=True)

    out = []
    seen = set()
    for score, txt in ranked:
        h = _hash_text(txt)
        if h in seen:
            continue
        seen.add(h)
        out.append(txt)
        if len(out) >= max_keep:
            break

    # fallback: if all scores 0, just take unique first max_keep
    if not out and contexts:
        out = []
        seen = set()
        for txt in contexts:
            h = _hash_text(txt)
            if h in seen:
                continue
            seen.add(h)
            out.append(txt)
            if len(out) >= max_keep:
                break

    return out


# -------------------------
# API Models
# -------------------------
class AskRequest(BaseModel):
    doc_id: str
    question: str
    top_k: int = 6  # ✅ better default than 3


# -------------------------
# Routes
# -------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}


def build_index_for_doc(doc_id: str) -> dict:
    text_path = TEXT_DIR / f"{doc_id}.txt"
    if not text_path.exists():
        return {"ok": False, "error": "Text file missing"}

    text = text_path.read_text(encoding="utf-8", errors="ignore").strip()
    if not text:
        return {"ok": False, "error": "Empty extracted text"}

    chunks = chunk_text(text)
    if not chunks:
        return {"ok": False, "error": "No chunks created"}

    # Save chunks
    (CHUNK_DIR / f"{doc_id}.json").write_text(
        json.dumps(chunks, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    embeddings = model.encode(chunks, convert_to_numpy=True, show_progress_bar=False).astype("float32")
    dim = embeddings.shape[1]

    # L2 index (works fine; for even better, you can normalize embeddings and use cosine)
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    faiss.write_index(index, str(INDEX_DIR / f"{doc_id}.faiss"))
    return {"ok": True, "chunks": len(chunks), "embedding_dim": int(dim)}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()  # .pdf / .docx / .txt

    if ext not in [".pdf", ".docx", ".txt"]:
        return {"error": "Only .pdf, .docx, .txt files are allowed"}

    doc_id = str(uuid.uuid4())

    # Save original file
    original_path = UPLOAD_DIR / f"{doc_id}{ext}"
    content = await file.read()
    original_path.write_bytes(content)

    # Extract text
    if ext == ".pdf":
        extracted = extract_text_from_pdf(original_path)
    elif ext == ".docx":
        extracted = extract_text_from_docx(original_path)
    else:
        extracted = extract_text_from_txt(original_path)

    # Save extracted text
    text_path = TEXT_DIR / f"{doc_id}.txt"
    text_path.write_text(extracted, encoding="utf-8")

    # Build index immediately
    index_info = build_index_for_doc(doc_id)

    return {
        "message": "uploaded, extracted, and indexed",
        "doc_id": doc_id,
        "file_type": ext.replace(".", ""),
        "text_length": len(extracted),
        "indexed": index_info.get("ok", False),
        "chunks": index_info.get("chunks"),
        "embedding_dim": index_info.get("embedding_dim"),
        "index_error": index_info.get("error"),
    }


@app.post("/index/{doc_id}")
def index_document(doc_id: str):
    # optional manual re-index
    doc_id = doc_id.strip()
    text_path = TEXT_DIR / f"{doc_id}.txt"
    if not text_path.exists():
        return {"error": "Text file not found for this doc_id. Upload first."}

    index_info = build_index_for_doc(doc_id)
    if not index_info.get("ok"):
        return {"error": index_info.get("error", "Indexing failed")}

    return {
        "message": "indexed successfully",
        "doc_id": doc_id,
        "chunks": index_info.get("chunks"),
        "embedding_dim": index_info.get("embedding_dim"),
    }


@app.post("/ask")
def ask_question(payload: AskRequest):
    doc_id = payload.doc_id.strip()
    question = payload.question.strip()
    top_k = max(1, min(payload.top_k, 10))

    chunks_path = CHUNK_DIR / f"{doc_id}.json"
    index_path = INDEX_DIR / f"{doc_id}.faiss"

    if not chunks_path.exists() or not index_path.exists():
        return {"error": "Index not found. Please upload again or call /index/{doc_id} first."}

    chunks = load_chunks(doc_id)
    index = load_faiss_index(doc_id)

    # Embed question
    q_emb = model.encode([question], convert_to_numpy=True).astype("float32")

    # ✅ Fetch more than top_k, then dedupe + diversify
    fetch_k = min(max(top_k * 4, top_k), 20)
    distances, indices = index.search(q_emb, fetch_k)

    results = []
    raw_contexts = []
    seen_hashes = set()

    for rank, idx in enumerate(indices[0]):
        if idx == -1:
            continue

        chunk_text_value = chunks[int(idx)]
        h = _hash_text(chunk_text_value)

        # ✅ DEDUPE repeated chunks (reduces repeated answers)
        if h in seen_hashes:
            continue
        seen_hashes.add(h)

        preview = (chunk_text_value[:300] + "...") if len(chunk_text_value) > 300 else chunk_text_value

        results.append({
            "rank": len(results) + 1,
            "chunk_index": int(idx),
            "distance": float(distances[0][rank]),
            "text": preview,
        })

        raw_contexts.append(chunk_text_value)

        if len(raw_contexts) >= fetch_k:
            break

    # ✅ Choose diversified contexts
    context_parts = diversify_contexts(question, raw_contexts, max_keep=top_k)

    # ✅ Route summary vs direct answer
    if is_summary_question(question):
        answer = summarize_document(context_parts, max_points=5)
    else:
        answer = sentence_level_answer(question, context_parts, max_points=5)

    return {
        "doc_id": doc_id,
        "question": question,
        "answer": answer,
        "sources": results[:top_k],
    }
