import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClientes, deleteCliente } from "../api/clientesApi";
import { getExpedientes } from "../api/expedientesApi";
import { useAuth } from "../context/AuthContext";
import { iniciales } from "../utils/tareas";

export default function Clientes() {
  const { user } = useAuth();
  const esAdmin = user?.role === "Admin";
  const puedeEditar = esAdmin || user?.puedeEditarClientes === true;
  const puedeEliminar = esAdmin || user?.puedeEliminarClientes === true;

  const [clientes, setClientes] = useState([]);
  const [expedientesPorCliente, setExpedientesPorCliente] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarClientes = async () => {
    setLoading(true);
    try {
      // El endpoint de clientes no trae sus expedientes: se cuentan aparte
      const [response, expedientesRes] = await Promise.all([getClientes(), getExpedientes()]);
      const conteo = {};
      expedientesRes.data.forEach((e) => {
        conteo[e.clienteId] = (conteo[e.clienteId] || 0) + 1;
      });
      setExpedientesPorCliente(conteo);
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
        <h2>Clientes</h2>
        {puedeEditar && (
          <Link to="/clientes/nuevo">
            <button className="btn btn-primary">+ Nuevo cliente</button>
          </Link>
        )}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DNI / CUIT</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Expedientes</th>
              {(puedeEditar || puedeEliminar) && <th>Acciones</th>}
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
                <td data-label="DNI / CUIT">{c.dni || "—"}</td>
                <td data-label="Email">{c.email || "—"}</td>
                <td data-label="Teléfono">{c.telefono || "—"}</td>
                <td data-label="Expedientes">{expedientesPorCliente[c.id] || 0}</td>
                {(puedeEditar || puedeEliminar) && (
                  <td data-label="Acciones">
                    {puedeEditar && (
                      <Link to={`/clientes/${c.id}/editar`} className="link-action" style={{ color: "var(--link)", fontWeight: 600 }}>Editar</Link>
                    )}
                    {puedeEditar && puedeEliminar && " · "}
                    {puedeEliminar && (
                      <button className="btn-danger-ghost" onClick={() => handleDelete(c.id)}>Eliminar</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {clientes.length === 0 && <p className="empty-state">No hay clientes cargados todavía.</p>}
      </div>
    </div>
  );
}