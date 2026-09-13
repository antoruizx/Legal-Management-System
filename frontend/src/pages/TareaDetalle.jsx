import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTarea } from "../api/tareasApi";
import BackButton from "../components/BackButton";

function getEstadoTarea(tarea) {
  if (tarea.completada) return { label: "Completada", clase: "badge-success", dot: "dot-success" };

  const hoy = new Date();
  const vencimiento = new Date(tarea.fechaVencimiento);
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

  if (diffDias < 0) return { label: "Urgente", clase: "badge-danger", dot: "dot-danger" };
  if (diffDias <= 3) return { label: "Próxima", clase: "badge-warning", dot: "dot-warning" };
  return { label: "Pendiente", clase: "badge-info", dot: "dot-info" };
}

export default function TareaDetalle() {
  const { id } = useParams();
  const [tarea, setTarea] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTarea(id)
      .then((response) => setTarea(response.data))
      .catch(() => setError("No se pudo cargar la tarea"));
  }, [id]);

  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!tarea) return <p>Cargando...</p>;

  const estado = getEstadoTarea(tarea);

  return (
    <div>
      <BackButton />

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <h2>{tarea.titulo}</h2>
            <span className={`badge ${estado.clase}`}>
              <span className={`badge-dot ${estado.dot}`}></span>
              {estado.label}
            </span>
          </div>
          <div className="detail-subtitle">
            {tarea.expediente ? `Expediente ${tarea.expediente.numero} — ${tarea.expediente.caratula}` : "Sin expediente asociado"}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <div className="detail-label">Vencimiento</div>
          <div className="detail-value">{new Date(tarea.fechaVencimiento).toLocaleDateString()}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Responsable</div>
          <div className="detail-value">
            {tarea.user ? `${tarea.user.firstName} ${tarea.user.lastName}` : "-"}
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Fecha de creación</div>
          <div className="detail-value">{new Date(tarea.fechaCreacion).toLocaleDateString()}</div>
        </div>
        {tarea.expediente && (
          <div className="detail-field">
            <div className="detail-label">Expediente</div>
            <div className="detail-value">
              <Link to={`/expedientes/${tarea.expediente.id}`}>{tarea.expediente.numero}</Link>
            </div>
          </div>
        )}
      </div>

      <div className="detail-section card">
        <h3>Descripción</h3>
        <p style={{ color: tarea.descripcion ? "var(--text-hi)" : "var(--text-lo)", fontSize: "14px" }}>
          {tarea.descripcion || "Sin descripción."}
        </p>
      </div>
    </div>
  );
}
