import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getExpedientes, deleteExpediente } from "../api/expedientesApi";
import BackButton from "../components/BackButton";
import ConfirmDialog from "../components/ConfirmDialog";
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

function formatFechaCreacion(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (d.getFullYear() < 1900) return "-";
  return d.toLocaleDateString();
}

export default function Expedientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const esAdmin = user?.role === "Admin";
  const puedeEditar = esAdmin || user?.puedeEditarExpedientes === true;
  const puedeEliminar = esAdmin || user?.puedeEliminarExpedientes === true;

  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aEliminar, setAEliminar] = useState(null);

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

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      await deleteExpediente(aEliminar);
      cargarExpedientes();
    } catch (err) {
      alert("No se pudo eliminar el expediente");
    } finally {
      setAEliminar(null);
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
              <th>Código</th>
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
                <tr
                  key={e.id}
                  className="clickable-row"
                  onClick={() => navigate(`/expedientes/${e.id}`)}
                >
                  <td data-label="Código">{e.numero}</td>
                  <td data-label="Carátula" style={{ color: "var(--text-hi)", fontWeight: 500 }}>
                    {e.caratula}
                  </td>
                  <td data-label="Estado">
                    <span className={`badge ${estado.clase}`}>
                      {estado.dot && <span className={`badge-dot ${estado.dot}`}></span>}
                      {e.estado}
                    </span>
                  </td>
                  <td data-label="Cliente">
                    {e.cliente ? (
                      <Link
                        to={`/clientes/${e.cliente.id}`}
                        className="link-action"
                        style={{ color: "var(--text-hi)" }}
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        {e.cliente.nombre} {e.cliente.apellido}
                      </Link>
                    ) : "-"}
                  </td>
                  <td data-label="Creado">{formatFechaCreacion(e.fechaCreacion)}</td>
                  {(puedeEditar || puedeEliminar) && (
                    <td data-label="Acciones" onClick={(ev) => ev.stopPropagation()}>
                      {puedeEditar && (
                        <Link to={`/expedientes/${e.id}/editar`} className="link-action">Editar</Link>
                      )}
                      {puedeEditar && puedeEliminar && " · "}
                      {puedeEliminar && (
                        <button className="btn-danger-ghost" onClick={() => setAEliminar(e.id)}>Eliminar</button>
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

      <ConfirmDialog
        abierto={aEliminar !== null}
        titulo="Eliminar expediente"
        mensaje="¿Seguro que querés eliminar este expediente? Esta acción no se puede deshacer."
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}