# main.py
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, UploadFile, File
from pathlib import Path
import uuid
import json
import re
from typing import List

import numpy as np
import faiss
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

from pypdf import PdfReader
import docx  # python-docx


app = FastAPI(title="AI Document Q&A API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
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
# Embedding model (free)
# -------------------------
model = SentenceTransformer("all-MiniLM-L6-v2")


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
# Helpers: short bullet answer (no LLM)
# -------------------------
def is_question_line(line: str) -> bool:
    line = line.strip()
    return line.endswith("?") or line.lower().startswith(("what ", "why ", "how ", "define ", "explain ", "discuss ", "compare "))

def cleanup_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip()

def make_bulleted_answer(question: str, chunks: List[str], max_points: int = 5) -> str:
    # Collect candidate lines from retrieved chunks
    lines = []
    for c in chunks:
        for line in c.split("\n"):
            line = cleanup_line(line)
            if 25 <= len(line) <= 200:
                lines.append(line)

    if not lines:
        return "No relevant text found in the indexed chunks."

    # Prefer statement-like lines (not ending with '?')
    statements = [l for l in lines if not is_question_line(l)]
    questions = [l for l in lines if is_question_line(l)]

    # keyword scoring
    keywords = [w.lower() for w in re.findall(r"[a-zA-Z]{4,}", question)]
    keywords = list(set(keywords))

    def score_line(l: str) -> int:
        ll = l.lower()
        return sum(1 for k in keywords if k in ll)

    # Score statements first
    scored_statements = sorted([(score_line(l), l) for l in statements], reverse=True, key=lambda x: x[0])
    best = [l for s, l in scored_statements if s > 0][:max_points]

    # If no good statements found, fall back to questions but present as "topics"
    if not best:
        scored_questions = sorted([(score_line(l), l) for l in questions], reverse=True, key=lambda x: x[0])
        top_q = [l for s, l in scored_questions if s > 0][:max_points]

        if not top_q:
            top_q = questions[:max_points]

        # Convert Q-style into topic bullets
        topic_bullets = []
        for q in top_q:
            q = q.rstrip("?").strip()
            # make it look like a topic
            topic_bullets.append(f"- Topic: {q}")
        return "This document mainly covers:\n" + "\n".join(topic_bullets)

    return "\n".join([f"- {b}" for b in best])



# -------------------------
# API Models
# -------------------------
class AskRequest(BaseModel):
    doc_id: str
    question: str
    top_k: int = 3


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
    doc_id = doc_id.strip()
    text_path = TEXT_DIR / f"{doc_id}.txt"
    if not text_path.exists():
        return {"error": "Text file not found for this doc_id. Upload first."}

    text = text_path.read_text(encoding="utf-8", errors="ignore")
    if not text.strip():
        return {"error": "Extracted text is empty. Try another document."}

    # 1) Chunking
    chunks = chunk_text(text)
    if not chunks:
        return {"error": "No chunks created from text."}

    # Save chunks
    chunks_path = CHUNK_DIR / f"{doc_id}.json"
    chunks_path.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")

    # 2) Embeddings
    embeddings = model.encode(chunks, convert_to_numpy=True, show_progress_bar=False).astype("float32")
    if embeddings.ndim != 2:
        return {"error": "Embedding generation failed."}

    # 3) FAISS index
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    # Save index
    index_path = INDEX_DIR / f"{doc_id}.faiss"
    faiss.write_index(index, str(index_path))

    return {
        "message": "indexed successfully",
        "doc_id": doc_id,
        "chunks": len(chunks),
        "embedding_dim": int(dim),
    }


@app.post("/ask")
def ask_question(payload: AskRequest):
    doc_id = payload.doc_id.strip()
    question = payload.question.strip()
    top_k = max(1, min(payload.top_k, 10))

    chunks_path = CHUNK_DIR / f"{doc_id}.json"
    index_path = INDEX_DIR / f"{doc_id}.faiss"
 
    
    if not chunks_path.exists() or not index_path.exists():
        return {"error": "Index not found. Please call /index/{doc_id} first."}

    chunks = load_chunks(doc_id)
    index = load_faiss_index(doc_id)

    # Embed question
    q_emb = model.encode([question], convert_to_numpy=True).astype("float32")

    # Search
    distances, indices = index.search(q_emb, top_k)

    results = []
    context_parts = []

    for rank, idx in enumerate(indices[0]):
        if idx == -1:
            continue
        chunk_text_value = chunks[int(idx)]

        preview = (chunk_text_value[:300] + "...") if len(chunk_text_value) > 300 else chunk_text_value

        results.append(
            {
                "rank": rank + 1,
                "chunk_index": int(idx),
                "distance": float(distances[0][rank]),
                "text": preview,
            }
        )
        context_parts.append(chunk_text_value)

    # Build a clean answer (no paid LLM)
    answer = make_bulleted_answer(question, context_parts, max_points=5)

    return {
        "doc_id": doc_id,
        "question": question,
        "answer": answer,
        "sources": results,
    }
