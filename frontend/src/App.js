import { useState } from "react";
import Navbar from "./components/Navbar";
import { uploadFile, askQuestion } from "./api";
import Sidebar from "./components/Sidebar";
import AboutPage from "./components/AboutPage";
import UploadedFileCard from "./components/UploadFileCard";
import SettingsPage, { loadSettings } from "./components/SettingPage";


export default function App() {
 

  const [active, setActive] = useState("upload");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [docId, setDocId] = useState(""); 
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [settings, setSettings] = useState(loadSettings());

  
  
  const makeId = () =>
  (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());

   const currentChat = chats.find((c) => c.id === activeChatId);
const chatMessages = currentChat?.messages || [];






const selectChat = (id) => {
  setActiveChatId(id);
  setActive("chat");
};

const deleteChat = (id) => {
  setChats((prev) => prev.filter((c) => c.id !== id));
  if (activeChatId === id) setActiveChatId(null);
};

const newChat = () => {
  const id = makeId();
  const chatObj = { id, title: "New Chat", docId: "", messages: [] };
  setChats((prev) => [chatObj, ...prev]);
  setActiveChatId(id);
  setQuestion("");
  setActive("upload");
  return id;
};

const makeTitle = (text) => {
  const t = (text || "").trim().replace(/\s+/g, " ");
  return t.length > 28 ? t.slice(0, 28) + "..." : t || "New Chat";
};

const pushMessage = (msg) => {
  let id = activeChatId;

  // if no active chat, create one and get id
  if (!id) {
    const newId = makeId();
    const chatObj = { id: newId, title: "New Chat", docId: "", messages: [] };
    setChats((prev) => [chatObj, ...prev]);
    setActiveChatId(newId);
    id = newId;
  }

  setChats((prev) =>
    prev.map((c) => {
      if (c.id !== id) return c;

      const nextMessages = [...(c.messages || []), msg];

      // ✅ If title is still "New Chat" and first user text message comes, set title
      const shouldSetTitle =
        (c.title === "New Chat" || !c.title) &&
        msg.role === "user" &&
        msg.type !== "file" &&
        typeof msg.text === "string" &&
        msg.text.trim().length > 0;

      return {
        ...c,
        title: shouldSetTitle ? makeTitle(msg.text) : c.title,
        messages: nextMessages,
      };
    })
  );
};



const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

 const handleUpload = async (file) => {
  if (!file) return;

  const formattedSize = formatFileSize(file.size);

  setLoading(true);

  const uploadRes = await uploadFile(file);

 if (uploadRes?.doc_id) {
  setDocId(uploadRes.doc_id);

  // ✅ store docId inside active chat too
  if (activeChatId) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, docId: uploadRes.doc_id } : c
      )
    );
  }

  const filePayload = {
    filename: file.name,
    size: formatFileSize(file.size),
    indexed: false,
    docId: uploadRes.doc_id,
  };

  // ✅ push as a user message (but with type=file)
  pushMessage({ role: "user", type: "file", file: filePayload });

  await indexDoc(uploadRes.doc_id);

  // ✅ update last file message to indexed=true
  setChats((prev) =>
    prev.map((c) => {
      if (c.id !== activeChatId) return c;
      const msgs = [...(c.messages || [])];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].type === "file") {
          msgs[i] = { ...msgs[i], file: { ...msgs[i].file, indexed: true } };
          break;
        }
      }
      return { ...c, messages: msgs };
    })
  );
}


  setLoading(false);
};


const indexDoc = async (docId) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/index/${docId}`, {
      method: "POST",
    });

    return await res.json();
  } catch (err) {
    console.error("Index error:", err);
    return { error: "Index failed" };
  }
};



const handleAsk = async () => {
  const currentChat = chats.find((c) => c.id === activeChatId);
  const currentDocId = currentChat?.docId || docId;

  if (!currentDocId) {
    pushMessage({ role: "bot", text: "Pehle document upload karo 🙂" });
    return;
  }

  if (!question.trim()) return;

  const q = question.trim();
  pushMessage({ role: "user", text: q });
  setQuestion("");
  setLoading(true);

  try {
    const data = await askQuestion(currentDocId, q, 3);

    if (data.error) {
      pushMessage({ role: "bot", text: `Error: ${data.error}` });
    } else {
      pushMessage({
        role: "bot",
        text: data.answer,
        sources: data.sources || [],
      });
    }
  } catch (e) {
    pushMessage({ role: "bot", text: "❌ Ask failed. Backend/CORS check karo." });
    console.error(e);
  }

  setLoading(false);
};






 return (
  <div className="app-container">

  {/* Navbar at top */}
  <Navbar />

  {/* Below Navbar */}
  <div className="main-layout">
    <Sidebar
  chats={chats}
  activeChatId={activeChatId}
  onNewChat={newChat}
  onSelectChat={selectChat}
  onDeleteChat={deleteChat}
  onNavigate={(tab) => setActive(tab)}
  activeTab={active}   // ✅ this is important
/>

    

  <div className="content-area">
    {active === "settings" && (
  <SettingsPage value={settings} onChange={setSettings} />
)}
  {active === "about" && <AboutPage />}

  {active !== "about" && active !== "settings" &&(
    <div className="chat-wrapper">
      {/* MESSAGES AREA */}
     <div className="chat-messages">
  {chatMessages.map((m, i) => (
    <div key={i} className={`msg ${m.role}`}>
      {m.type === "file" ? (
        <UploadedFileCard
          fileName={m.file.filename}
          sizeText={m.file.size}
          uploadedText={m.file.indexed ? "Indexed" : "Indexing..."}
          onView={() => console.log("view")}
          onDownload={() => console.log("download")}
          onDelete={() => console.log("delete")}
        />
      ) : (
        <>
          <div className="msg-bubble">
  <div className="msg-text">{m.text}</div>
</div>

        </>
      )}
    </div>
  ))}
</div>

      {/* FIXED INPUT AREA */}
      <div className="chat-input-area">
        <input
          id="fileUpload"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => handleUpload(e.target.files?.[0])}
          className="file-hidden"
        />

        <label htmlFor="fileUpload" className="icon-btn" title="Upload document">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4M12 4L7 9M12 4L17 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20H20"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </label>

        <input
          className="chat-text-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
        />

        <button className="ask-btn" onClick={handleAsk} disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
   
  )}
</div>



  </div>
  </div>
);

}
