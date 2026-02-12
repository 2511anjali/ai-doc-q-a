import { FaUserCircle } from "react-icons/fa";
import { IoNotificationsOutline } from "react-icons/io5";
import { FiInfo } from "react-icons/fi";
import NotificationIcon from "./Notification";
import UserAvatar from "./UserAvtar";
import { HiOutlineInformationCircle } from "react-icons/hi2";
import logo from "../assets/logo.jpg";




export default function Navbar() {
  return (
    <div style={styles.navbar}>
      
      {/* LEFT SIDE */}
      <div style={styles.left}>
        <div style={styles.logoBox}>
          <svg
  className="app-logo"
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle cx="32" cy="32" r="30" fill="white" />
  <path
    d="M22 44 L32 20 L42 44"
    stroke="#b30000"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <line
    x1="26"
    y1="34"
    x2="38"
    y2="34"
    stroke="#b30000"
    stroke-width="4"
    stroke-linecap="round"
  />
</svg>


          <div style={{...styles.projectName, fontSize:"24px"}}>AskDoc</div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={styles.right}>
  
  <div
  style={{...styles.iconBox,  marginRight :"8px" } }
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
    e.currentTarget.style.transform = "scale(1.08)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  <HiOutlineInformationCircle size={24} color="white"  />
</div>


  <div style={{...styles.iconBox,  marginRight :"12px" }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
    e.currentTarget.style.transform = "scale(1.08)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "transparent";
    e.currentTarget.style.transform = "scale(1)";
  }}
  >
    <NotificationIcon size={24} color="white" />
  </div>

  <UserAvatar initials="AS" size={38} />

</div>

    </div>
  );
}

const styles = {
  navbar: {
  height: "80px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 24px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(90deg, #630303 0%, #d80303 100%)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
},

  left: {
    display: "flex",
    alignItems: "center",
  },

  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logoCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

 projectName: {
  fontSize: "18px",
  fontWeight: "600",
  color: "white",
},

 right: {
  display: "flex",
  alignItems: "center",
},

iconBox: {
  width: "38px",
  height: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  cursor: "pointer",
  transition: "all 0.25s ease",
},


 icon: {
  cursor: "pointer",
  paddingLeft: "0px",
  padding: "8px",
  borderRadius: "8px",
  transition: "0.2s ease",
},


  profile: {
    cursor: "pointer",
  },
};
