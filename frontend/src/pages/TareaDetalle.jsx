import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTarea, updateTarea } from "../api/tareasApi";
import BackButton from "../components/BackButton";

function getEstadoTarea(tarea) {
  if (tarea.completada) return { label: "Completada", clase: "badge-success", dot: "dot-success" };
  const hoy = new Date();
  const vencimiento = new Date(tarea.fechaVencimiento);
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
  if (diffDias < 0) return { label: "Vencida", clase: "badge-danger", dot: "dot-danger" };
  if (diffDias <= 3) return { label: "Proxima a vencer", clase: "badge-warning", dot: "dot-warning" };
  return { label: "Pendiente", clase: "badge-info", dot: "dot-info" };
}

export default function TareaDetalle() {
  const { id } = useParams();
  const [tarea, setTarea] = useState(null);
  const [error, setError] = useState("");

  const cargarTarea = () => {
    getTarea(id)
      .then((response) => setTarea(response.data))
      .catch(() => setError("No se pudo cargar la tarea"));
  };

  useEffect(() => {
    cargarTarea();
  }, [id]);

  const handleToggleCompletada = async () => {
    try {
      const payload = {
        ...tarea,
        completada: !tarea.completada,
      };
      await updateTarea(id, payload);
      cargarTarea();
    } catch {
      setError("No se pudo actualizar la tarea");
    }
  };

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
          {tarea.descripcion && (
            <div className="detail-subtitle">{tarea.descripcion}</div>
          )}
        </div>
        <button
          className={`btn ${tarea.completada ? "" : "btn-primary"}`}
          onClick={handleToggleCompletada}
        >
          {tarea.completada ? "Marcar pendiente" : "Marcar completada"}
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <div className="detail-label">Fecha de vencimiento</div>
          <div className="detail-value">
            {new Date(tarea.fechaVencimiento).toLocaleDateString()}
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Expediente</div>
          <div className="detail-value">
            {tarea.expediente
              ? `${tarea.expediente.numero} - ${tarea.expediente.caratula}`
              : "-"}
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Responsable</div>
          <div className="detail-value">
            {tarea.user
              ? `${tarea.user.firstName} ${tarea.user.lastName}`
              : "-"}
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Completada</div>
          <div className="detail-value">{tarea.completada ? "Si" : "No"}</div>
        </div>
      </div>
    </div>
  );
}
