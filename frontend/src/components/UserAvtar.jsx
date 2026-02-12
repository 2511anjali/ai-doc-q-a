export default function UserAvatar({ initials = "AS", size = 38 }) {
  return (
   <div
  style={{
    width: size,
    height: size,
    borderRadius: "50%",
    background: "#f9efee",
    color: "#8d0303",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.45,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.25s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.08)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  {initials}
</div>

  );
}
