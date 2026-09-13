import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>

      <div className="navbar-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 7L2 13C2 14.6569 3.34315 16 5 16C6.65685 16 8 14.6569 8 13L5 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 7L16 13C16 14.6569 17.3431 16 19 16C20.6569 16 22 14.6569 22 13L19 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Legal Management System
      </div>

      <div className="navbar-search">
        <span>🔍</span>
        <input type="text" placeholder="Buscar..." />
      </div>

      <div className="navbar-actions">
        <button className="icon-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

       <NotificationBell />

        <div style={{ position: "relative" }}>
          <button className="user-menu-btn" onClick={() => setMenuAbierto(!menuAbierto)}>
            {user?.firstName} ▾
          </button>

          {menuAbierto && (
            <div className="user-menu-dropdown">
              <div className="info">
                {user?.firstName} {user?.lastName}
                <br />
                <small>{user?.role}</small>
              </div>
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}