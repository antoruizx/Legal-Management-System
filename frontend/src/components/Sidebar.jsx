import { NavLink } from "react-router-dom";

export default function Sidebar({ open, onClose }) {
  const linkClass = ({ isActive }) => `sidebar-link${isActive ? " active" : ""}`;

  return (
    <>
      <div className={`sidebar-overlay${open ? " visible" : ""}`} onClick={onClose} />
      <div className={`sidebar${open ? " open" : ""}`}>
        <NavLink to="/dashboard" className={linkClass} onClick={onClose}>Dashboard</NavLink>
        <NavLink to="/clientes" className={linkClass} onClick={onClose}>Clientes</NavLink>
        <NavLink to="/expedientes" className={linkClass} onClick={onClose}>Expedientes</NavLink>
        <NavLink to="/tareas" className={linkClass} onClick={onClose}>Tareas</NavLink>

        <hr className="sidebar-divider" />
        <NavLink to="/usuarios" className={linkClass} onClick={onClose}>Usuarios</NavLink>
      </div>
    </>
  );
}