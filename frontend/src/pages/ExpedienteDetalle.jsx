import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExpediente } from "../api/expedientesApi";
import BackButton from "../components/BackButton";

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

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const [expediente, setExpediente] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getExpediente(id)
      .then((response) => setExpediente(response.data))
      .catch(() => setError("No se pudo cargar el expediente"));
  }, [id]);

  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!expediente) return <p>Cargando...</p>;

  const estadoBadge = getEstadoBadge(expediente.estado);

  return (
    <div>
      <BackButton />

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <h2>{expediente.caratula}</h2>
            <span className={`badge ${estadoBadge.clase}`}>
              {estadoBadge.dot && <span className={`badge-dot ${estadoBadge.dot}`}></span>}
              {expediente.estado}
            </span>
          </div>
          <div className="detail-subtitle">Expediente N.º {expediente.numero}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <div className="detail-label">Cliente</div>
          <div className="detail-value">
            {expediente.cliente ? `${expediente.cliente.nombre} ${expediente.cliente.apellido}` : "-"}
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Fecha de inicio</div>
          <div className="detail-value">{new Date(expediente.fechaInicio).toLocaleDateString()}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Movimientos</div>
          <div className="detail-value">{expediente.movimientos?.length || 0}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Tareas</div>
          <div className="detail-value">{expediente.tareas?.length || 0}</div>
        </div>
      </div>

      <div className="detail-section card">
        <h3>Movimientos</h3>
        {expediente.movimientos && expediente.movimientos.length > 0 ? (
          <div className="timeline">
            {expediente.movimientos.map((m) => (
              <div className="timeline-item" key={m.id}>
                <div className="timeline-meta">{new Date(m.fecha).toLocaleDateString()}</div>
                <div className="timeline-title">{m.tipo}</div>
                <div className="timeline-desc">{m.descripcion}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No hay movimientos cargados todavía.</p>
        )}
      </div>

      <div className="detail-section card">
        <h3>Tareas</h3>
        {expediente.tareas && expediente.tareas.length > 0 ? (
          expediente.tareas.map((t) => (
            <Link to={`/tareas/${t.id}`} key={t.id} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="task-row">
                <div>
                  <div className="task-title">{t.titulo}</div>
                  <div className="task-due">Vence: {new Date(t.fechaVencimiento).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${t.completada ? "badge-success" : "badge-warning"}`}>
                  <span className={`badge-dot ${t.completada ? "dot-success" : "dot-warning"}`}></span>
                  {t.completada ? "Completada" : "Pendiente"}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="empty-state">No hay tareas cargadas todavía.</p>
        )}
      </div>
    </div>
  );
}
