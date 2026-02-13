import "../App.css";
import himanshuImg from "../assets/team/Himanshu.jpeg";
import anjaliImg from "../assets/team/AnjaliImage.jpeg";
import manthanImg from "../assets/team/ManthanImage.jpeg";
import kirtiImg from "../assets/team/KirtiImage.jpeg";
export default function AboutPage() {
  const team = [
    { name: "Anjali Chauhan", role: "Backend Developer", initials: "AC" },
    { name: "Kirti Pathak", role: "Project Manager", initials: "KP" },
    { name: "Himanshu Kumar", role: "Frontend Developer", initials: "HK" },
    { name: "Manthan Shekhawat", role: "Frontend Developer", initials: "MS" },
  ];

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>About AI Doc Q&amp;A (RAG)</h2>

      <p style={styles.desc}>
        AI Doc Q&amp;A is a Retrieval-Augmented Generation (RAG) web application that lets users
        upload documents (PDF/DOCX/TXT), automatically extracts text, creates embeddings, builds a
        vector index (FAISS), and answers user questions by retrieving the most relevant document
        chunks with sources.
      </p>

     <div className="about-cards-row">
  <div className="about-card light">
    <h3>What this app does</h3>
    <ul>
      <li>Upload documents and extract text</li>
      <li>Chunk content for better retrieval</li>
      <li>Create embeddings and store in FAISS</li>
      <li>Ask questions with supporting sources</li>
    </ul>
  </div>

  <div className="about-card light">
    <h3>Tech Stack</h3>
    <ul>
      <li><b>Frontend:</b> React</li>
      <li><b>Backend:</b> FastAPI</li>
      <li><b>Vector DB:</b> FAISS</li>
      <li><b>Embeddings:</b> SentenceTransformers</li>
    </ul>
  </div>
</div>


      
      <div className="team-section">
  <h2 className="team-title">Team Members</h2>

  <div className="team-grid">
    <div className="member-card">
      <div className="member-image">
         <img src={anjaliImg} alt="AC" />
      </div>
      <h3>Anjali Chauhan</h3>
      <p>Backend Developer</p>
    </div>

    <div className="member-card">
     <div className="member-image">
         <img src={kirtiImg} alt="KP" />
      </div>
      <h3>Kirti Pathak</h3>
      <p>Project Manager</p>
    </div>

    <div className="member-card">
      <div className="member-image">
         <img src={himanshuImg} alt="H K" />
      </div>
      <h3>Himanshu Kumar</h3>
      <p>Frontend Developer</p>
    </div>

    <div className="member-card">
      <div className="member-image">
         <img src={manthanImg} alt="MS" />
      </div>
      <h3>Manthan Shekhawat</h3>
      <p>Frontend Developer</p>
    </div>
  </div>
</div>

    </div>
  );
}

const styles = {
  wrap: { maxWidth: 900, margin: "0 auto" },

  title: { color: "rgba(23, 1, 1, 0.85)", margin: " 0 8px 8px 8px" ,textAlign:"center",fontFamily:" sans-serif" },
  desc: { color: "rgba(91, 3, 3, 0.85)", lineHeight: 1.7 },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 16,
  },

  card: {
    background: "#1A1A1A",
    border: "1px solid rgba(255,0,0,0.15)",
    borderRadius: 16,
    padding: 16,
  },

  cardTitle: { color: "white", margin: "0 0 10px",textAlign:"center",fontFamily:" sans-serif" },
  list: { color: "rgba(255,255,255,0.85)", margin: 0, paddingLeft: 18 },

  

  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
    marginTop: 12,
  },

  memberCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "linear-gradient(180deg, rgba(85, 1, 1, 0.92) 0%, rgba(223, 6, 6, 0.92) 100%)",
    border: "1px solid rgba(255,0,0,0.15)",
    borderRadius: 16,
    padding: 14,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#5C0000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 700,
  },

  memberName: { color: "white", fontWeight: 600 },
  memberRole: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
};
