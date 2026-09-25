import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExpedientes, deleteExpediente } from "../api/expedientesApi";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

function getEstadoBadge(estado) {
  switch (estado) {
    case "Activo":
      return { clase: "badge-success", dot: "dot-success" };
    case "En trámite":
      return { clase: "badge-info", dot: "dot-info" };
    case "Cerrado":
      return { clase: "badge-danger", dot: "dot-danger" };
    case "Archivado":
      return { clase: "badge-warning", dot: "dot-warning" };
    default:
      return { clase: "badge-neutral", dot: "" };
  }
}

export default function Expedientes() {
  const { user } = useAuth();
  const esAdmin = user?.role === "Admin";
  const puedeEditar = esAdmin || user?.puedeEditarExpedientes === true;
  const puedeEliminar = esAdmin || user?.puedeEliminarExpedientes === true;

  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarExpedientes = async () => {
    setLoading(true);
    try {
      const response = await getExpedientes();
      setExpedientes(response.data);
    } catch (err) {
      setError("No se pudieron cargar los expedientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este expediente?")) return;

    try {
      await deleteExpediente(id);
      cargarExpedientes();
    } catch (err) {
      alert("No se pudo eliminar el expediente");
    }
  };

  if (loading) return <p>Cargando expedientes...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
    <div className="page-header">
      <div>
        <BackButton />
        <h2>Expedientes</h2>
      </div>
      {puedeEditar && (
        <Link to="/expedientes/nuevo">
          <button className="btn btn-primary">+ Nuevo Expediente</button>
        </Link>
      )}
    </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Carátula</th>
              <th>Estado</th>
              <th>Cliente</th>
              <th>Creado</th>
              {(puedeEditar || puedeEliminar) && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {expedientes.map((e) => {
              const estado = getEstadoBadge(e.estado);
              return (
                <tr key={e.id}>
                  <td data-label="Número">{e.numero}</td>
                  <td data-label="Carátula">
                    <Link to={`/expedientes/${e.id}`} style={{ color: "var(--text-hi)", fontWeight: 500 }}>
                      {e.caratula}
                    </Link>
                  </td>
                  <td data-label="Estado">
                    <span className={`badge ${estado.clase}`}>
                      {estado.dot && <span className={`badge-dot ${estado.dot}`}></span>}
                      {e.estado}
                    </span>
                  </td>
                  <td data-label="Cliente">
                    {e.cliente ? (
                      <Link to={`/clientes/${e.cliente.id}`} className="link-action" style={{ color: "var(--text-hi)" }}>
                        {e.cliente.nombre} {e.cliente.apellido}
                      </Link>
                    ) : "-"}
                  </td>
                  <td data-label="Creado">{new Date(e.fechaCreacion).toLocaleDateString()}</td>
                  {(puedeEditar || puedeEliminar) && (
                    <td data-label="Acciones">
                      {puedeEditar && (
                        <Link to={`/expedientes/${e.id}/editar`} className="link-action">Editar</Link>
                      )}
                      {puedeEditar && puedeEliminar && " · "}
                      {puedeEliminar && (
                        <button className="btn-danger-ghost" onClick={() => handleDelete(e.id)}>Eliminar</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {expedientes.length === 0 && <p className="empty-state">No hay expedientes cargados todavía.</p>}
      </div>
    </div>
  );
}