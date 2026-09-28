import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTareas, updateTarea, deleteTarea } from "../api/tareasApi";
import BackButton from "../components/BackButton";
import ConfirmDialog from "../components/ConfirmDialog";

function getEstadoTarea(tarea) {
  if (tarea.completada) return { label: "Completada", clase: "badge-success", dot: "dot-success" };

  const hoy = new Date();
  const vencimiento = new Date(tarea.fechaVencimiento);
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

  if (diffDias < 0) return { label: "Vencida", clase: "badge-danger", dot: "dot-danger" };
  if (diffDias <= 3) return { label: "Próxima a vencer", clase: "badge-warning", dot: "dot-warning" };
  return { label: "Pendiente", clase: "badge-info", dot: "dot-info" };
}

function formatFechaCreacion(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (d.getFullYear() < 1900) return "-";
  return d.toLocaleDateString();
}

export default function Tareas() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("Todas");
  const [aEliminar, setAEliminar] = useState(null);

  const cargarTareas = async () => {
    setLoading(true);
    try {
      const response = await getTareas();
      setTareas(response.data);
    } catch (err) {
      setError("No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  const handleToggleCompletada = async (tarea) => {
    try {
      await updateTarea(tarea.id, { ...tarea, completada: !tarea.completada });
      cargarTareas();
    } catch (err) {
      alert("No se pudo actualizar la tarea");
    }
  };

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    try {
      await deleteTarea(aEliminar);
      cargarTareas();
    } catch (err) {
      alert("No se pudo eliminar la tarea");
    } finally {
      setAEliminar(null);
    }
  };

  if (loading) return <p>Cargando tareas...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  const tareasFiltradas = tareas.filter((t) => {
    const estado = getEstadoTarea(t).label;
    if (filtro === "Todas") return true;
    if (filtro === "Completadas") return estado === "Completada";
    if (filtro === "Pendientes") return estado === "Pendiente" || estado === "Próxima a vencer";
    if (filtro === "Vencidas") return estado === "Vencida";
    return true;
  });

  const vencidas = tareas.filter((t) => getEstadoTarea(t).label === "Vencida").length;
  const proximas = tareas.filter((t) => getEstadoTarea(t).label === "Próxima a vencer").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <BackButton />
          <h2>Tareas</h2>
        </div>
        <Link to="/tareas/nuevo">
          <button className="btn btn-primary">+ Nueva Tarea</button>
        </Link>
      </div>

      {(vencidas > 0 || proximas > 0) && (
        <div className="alert-banner alert-warning">
          {vencidas > 0 && <span>⚠️ Tenés {vencidas} tarea(s) vencida(s)</span>}
          {proximas > 0 && <span>⏰ Tenés {proximas} tarea(s) próxima(s) a vencer</span>}
        </div>
      )}

      <div className="filter-row">
        {["Todas", "Pendientes", "Vencidas", "Completadas"].map((f) => (
          <button
            key={f}
            className={`filter-chip ${filtro === f ? "active" : ""}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Expediente</th>
              <th>Responsable</th>
              <th>Creada</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareasFiltradas.map((t) => {
              const estado = getEstadoTarea(t);
              return (
                <tr
                  key={t.id}
                  className="clickable-row"
                  onClick={() => navigate(`/tareas/${t.id}`)}
                >
                  <td data-label="Título" style={{ color: "var(--text-hi)", fontWeight: 500 }}>
                    {t.titulo}
                  </td>
                  <td data-label="Expediente">
                    {t.expediente ? (
                      <Link
                        to={`/expedientes/${t.expediente.id}`}
                        className="link-action"
                        style={{ color: "var(--text-hi)" }}
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        {t.expediente.caratula}
                      </Link>
                    ) : "-"}
                  </td>
                  <td data-label="Responsable">{t.user ? `${t.user.firstName} ${t.user.lastName}` : "-"}</td>
                  <td data-label="Creada">{formatFechaCreacion(t.fechaCreacion)}</td>
                  <td data-label="Vencimiento">{new Date(t.fechaVencimiento).toLocaleDateString()}</td>
                  <td data-label="Estado">
                    <span className={`badge ${estado.clase}`}>
                      <span className={`badge-dot ${estado.dot}`}></span>
                      {estado.label}
                    </span>
                  </td>
                  <td data-label="Acciones" onClick={(ev) => ev.stopPropagation()}>
                    <button className="link-action" onClick={() => handleToggleCompletada(t)}>
                      {t.completada ? "Marcar pendiente" : "Marcar completada"}
                    </button>
                    {" · "}
                    <Link to={`/tareas/${t.id}/editar`} className="link-action">Editar</Link>
                    {" · "}
                    <button className="btn-danger-ghost" onClick={() => setAEliminar(t.id)}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tareasFiltradas.length === 0 && <p className="empty-state">No hay tareas para este filtro.</p>}
      </div>

      <ConfirmDialog
        abierto={aEliminar !== null}
        titulo="Eliminar tarea"
        mensaje="¿Seguro que querés eliminar esta tarea? Esta acción no se puede deshacer."
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}