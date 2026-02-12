import { useMemo } from "react";

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onNavigate,
  activeTab, // ✅ add this prop from App
}) {
  const grouped = useMemo(() => ({ all: chats }), [chats]);

  return (
    <div style={styles.sidebar}>
      <div style={styles.top}>
        <button style={styles.newChatBtn} onClick={onNewChat}>
           New chat
        </button>

        <div style={styles.quickLinks}>
          <button
            style={{
              ...styles.linkBtn,
              ...(activeTab === "upload" ? styles.linkBtnActive : {}),
            }}
            onClick={() => onNavigate("upload")}
          >
            Upload
          </button>

          

          <button
            style={{
              ...styles.linkBtn,
              ...(activeTab === "about" ? styles.linkBtnActive : {}),
            }}
            onClick={() => onNavigate("about")}
          >
            About
          </button>

          <button
            style={styles.linkBtn}
            onClick={() => onNavigate("settings")}
          >
            Settings
          </button>
        </div>

        <div style={styles.sectionTitle}>Chat history</div>
      </div>

      <div style={styles.history}>
        {grouped.all.length === 0 ? (
          <div style={styles.empty}>No chats yet</div>
        ) : (
          grouped.all.map((c) => (
            <div
              key={c.id}
              style={{
                ...styles.chatRow,
                ...(c.id === activeChatId ? styles.chatRowActive : {}),
              }}
              onClick={() => onSelectChat(c.id)}
              title={c.title}
            >
              <div style={styles.chatTitle}>{c.title}</div>

              <button
                style={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(c.id);
                }}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div style={styles.bottom}>
        <div style={styles.footerText}>AI Doc Q&A • RAG</div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 280,
    height: "100vh",
    position: "sticky",
    top: 0,
    background: "#580202",
    color: "white",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid rgba(255,255,255,0.12)",
  },
  top: { padding: 14 },
  newChatBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(90deg, #630303 0%, #d80303 100%)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  quickLinks: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 12,
  },
  linkBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(90deg, #630303 0%, #d80303 100%)",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "center",
    transition: "all 0.3s ease",
  },
  linkBtnActive: {
    outline: "2px solid rgba(255,255,255,0.35)",
    transform: "translateY(-1px)",
  },
  sectionTitle: {
    marginTop: 14,
    fontSize: 12,
    opacity: 0.75,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  history: { padding: 10, overflowY: "auto", flex: 1 },
  empty: { padding: 12, fontSize: 13, opacity: 0.75 },
  chatRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 12,
    cursor: "pointer",
    marginBottom: 8,
    background: "transparent",
    border: "1px solid transparent",
  },
  chatRowActive: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
  },
  chatTitle: {
    fontSize: 13,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 210,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    lineHeight: "22px",
    fontSize: 16,
  },
  bottom: { padding: 12, borderTop: "1px solid rgba(255,255,255,0.12)" },
  footerText: { fontSize: 12, opacity: 0.8 },
};
