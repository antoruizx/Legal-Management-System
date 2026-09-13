import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { getClientes } from "../api/clientesApi";
import { getExpedientes } from "../api/expedientesApi";
import { getTareas } from "../api/tareasApi";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [datos, setDatos] = useState({ clientes: [], expedientes: [], tareas: [] });
  const [datosCargados, setDatosCargados] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const asegurarDatos = async () => {
    if (datosCargados) return;
    try {
      const [clientesRes, expedientesRes, tareasRes] = await Promise.all([
        getClientes(),
        getExpedientes(),
        getTareas(),
      ]);
      setDatos({
        clientes: clientesRes.data,
        expedientes: expedientesRes.data,
        tareas: tareasRes.data,
      });
      setDatosCargados(true);
    } catch (err) {
      // si falla, la búsqueda simplemente no mostrará resultados
    }
  };

  const handleFocus = () => {
    setDropdownOpen(true);
    asegurarDatos();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const q = query.trim().toLowerCase();

  const clientesMatch = q.length >= 2
    ? datos.clientes.filter((c) =>
        `${c.nombre} ${c.apellido} ${c.dni || ""} ${c.email || ""}`.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const expedientesMatch = q.length >= 2
    ? datos.expedientes.filter((e) =>
        `${e.numero} ${e.caratula} ${e.estado || ""}`.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const tareasMatch = q.length >= 2
    ? datos.tareas.filter((t) =>
        `${t.titulo} ${t.descripcion || ""}`.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const sinResultados = q.length >= 2 && clientesMatch.length === 0 && expedientesMatch.length === 0 && tareasMatch.length === 0;

  const irA = (path) => {
    navigate(path);
    setQuery("");
    setDropdownOpen(false);
  };

  return (
    <div className="navbar">
      <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>

      <div className="navbar-logo">
        <img
          src="/jp-estudio-juridico-logo.png"
          alt="Logo JP Estudio Jurídico"
          className="logo-circular"
        />
        <span>Legal Management System</span>
      </div>

      <div className="navbar-search" ref={searchRef}>
        <span>🔍</span>
        <input
          type="text"
          placeholder="Buscar cliente, expediente o tarea..."
          value={query}
          onFocus={handleFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
        />

        {dropdownOpen && q.length >= 2 && (
          <div className="search-dropdown">
            {clientesMatch.length > 0 && (
              <div className="search-group">
                <div className="search-group-label">Clientes</div>
                {clientesMatch.map((c) => (
                  <button key={`c-${c.id}`} className="search-result-item" onClick={() => irA(`/clientes/${c.id}`)}>
                    <span className="client-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                      {`${c.nombre?.[0] || ""}${c.apellido?.[0] || ""}`.toUpperCase()}
                    </span>
                    <span>{c.nombre} {c.apellido}</span>
                  </button>
                ))}
              </div>
            )}

            {expedientesMatch.length > 0 && (
              <div className="search-group">
                <div className="search-group-label">Expedientes</div>
                {expedientesMatch.map((e) => (
                  <button key={`e-${e.id}`} className="search-result-item" onClick={() => irA(`/expedientes/${e.id}`)}>
                    <span className="badge badge-neutral">{e.numero}</span>
                    <span>{e.caratula}</span>
                  </button>
                ))}
              </div>
            )}

            {tareasMatch.length > 0 && (
              <div className="search-group">
                <div className="search-group-label">Tareas</div>
                {tareasMatch.map((t) => (
                  <button key={`t-${t.id}`} className="search-result-item" onClick={() => irA(`/tareas/${t.id}`)}>
                    <span>{t.titulo}</span>
                  </button>
                ))}
              </div>
            )}

            {sinResultados && <div className="search-empty">Sin resultados para "{query}"</div>}
          </div>
        )}
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
