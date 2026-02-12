const API_BASE = "http://127.0.0.1:8000";

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form,
  });
  return res.json();
}

export async function askQuestion(doc_id, question, top_k = 3) {
  const res = await fetch(`${API_BASE}/ask`, {
    
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc_id, question, top_k }),
    
  });
  return res.json();
}
