import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#1f2937",
        color: "white",
      }}
    >
      <h3 style={{ margin: 0 }}>Legal Management System</h3>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <span>{user?.firstName} {user?.lastName} ({user?.role})</span>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}