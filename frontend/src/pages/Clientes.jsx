import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClientes, deleteCliente } from "../api/clientesApi";
import BackButton from "../components/BackButton";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await getClientes();
      setClientes(response.data);
    } catch (err) {
      setError("No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este cliente?")) return;

    try {
      await deleteCliente(id);
      cargarClientes();
    } catch (err) {
      alert("No se pudo eliminar el cliente");
    }
  };

  if (loading) return <p>Cargando clientes...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <div className="page-header">
      <div>
        <BackButton />
        <h2>Clientes</h2>
      </div>
      <Link to="/clientes/nuevo">
        <button className="btn btn-primary">+ Nuevo Cliente</button>
      </Link>
    </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td data-label="Cliente">
                  <Link to={`/clientes/${c.id}`} className="client-list-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="client-avatar">{iniciales(c.nombre, c.apellido)}</div>
                    <span>{c.nombre} {c.apellido}</span>
                  </Link>
                </td>
                <td data-label="DNI">{c.dni}</td>
                <td data-label="Email">{c.email}</td>
                <td data-label="Teléfono">{c.telefono}</td>
                <td data-label="Acciones">
                  <Link to={`/clientes/${c.id}/editar`} className="link-action">Editar</Link>
                  {" · "}
                  <button className="btn-danger-ghost" onClick={() => handleDelete(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clientes.length === 0 && <p className="empty-state">No hay clientes cargados todavía.</p>}
      </div>
    </div>
  );
}
