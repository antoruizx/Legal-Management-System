import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 15px",
  color: isActive ? "#1f2937" : "#374151",
  backgroundColor: isActive ? "#e5e7eb" : "transparent",
  textDecoration: "none",
  borderRadius: "6px",
  marginBottom: "5px",
});

export default function Sidebar() {
  return (
    <div style={{ width: "200px", padding: "15px", borderRight: "1px solid #e5e7eb" }}>
      <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
      <NavLink to="/clientes" style={linkStyle}>Clientes</NavLink>
      <NavLink to="/expedientes" style={linkStyle}>Expedientes</NavLink>
      <NavLink to="/tareas" style={linkStyle}>Tareas</NavLink>
    </div>
  );
}