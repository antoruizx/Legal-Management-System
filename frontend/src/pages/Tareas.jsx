import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTareas, updateTarea, deleteTarea } from "../api/tareasApi";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";
import { getEstadoTarea } from "../utils/tareas";

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

  // Lo más atrasado primero; las completadas al final
  const ordenadas = [...tareas].sort(
    (a, b) => a.completada - b.completada || new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
  );

  const tareasFiltradas = ordenadas.filter((t) => {
    const estado = getEstadoTarea(t).clave;
    if (filtro === "Completadas") return estado === "completada";
    if (filtro === "Pendientes") return estado !== "completada" && estado !== "vencida";
    if (filtro === "Vencidas") return estado === "vencida";
    return true;
  });

  const vencidas = tareas.filter((t) => getEstadoTarea(t).clave === "vencida").length;
  const urgentes = tareas.filter((t) => getEstadoTarea(t).clave === "urgente").length;

  return (
    <div>
      <div className="page-header">
        <h2>Tareas</h2>
        <Link to="/tareas/nuevo">
          <button className="btn btn-primary">+ Nueva tarea</button>
        </Link>
      </div>

      {(vencidas > 0 || urgentes > 0) && (
        <div className="alert-banner alert-warning">
          {vencidas > 0 && (
            <span className="alert-line"><Icon name="alert" size={16} /> Tenés {vencidas} {vencidas === 1 ? "tarea vencida" : "tareas vencidas"}</span>
          )}
          {urgentes > 0 && (
            <span className="alert-line"><Icon name="clock" size={16} /> {urgentes === 1 ? "1 tarea vence" : `${urgentes} tareas vencen`} en los próximos 2 días</span>
          )}
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
              <th>Vence</th>
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
                  <td data-label="Título" style={{ fontWeight: 600 }}>
                    {t.titulo}
                  </td>
                  <td data-label="Expediente">
                    {t.expediente ? (
                      <Link
                        to={`/expedientes/${t.expediente.id}`}
                        className="link-strong"
                        title={t.expediente.caratula}
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        {t.expediente.numero}
                      </Link>
                    ) : "-"}
                  </td>
                  <td data-label="Responsable">{t.user ? `${t.user.firstName} ${t.user.lastName}` : "-"}</td>
                  <td data-label="Vence">{new Date(t.fechaVencimiento).toLocaleDateString()}</td>
                  <td data-label="Estado">
                    <span className={`badge ${estado.clase}`}>
                      <span className={`badge-dot ${estado.dot}`}></span>
                      {estado.label}
                    </span>
                  </td>
                  <td data-label="Acciones" onClick={(ev) => ev.stopPropagation()}>
                    <button className="link-action" onClick={() => handleToggleCompletada(t)}>
                      {t.completada ? "Reabrir" : "Completar"}
                    </button>
                    {" · "}
                    <Link to={`/tareas/${t.id}/editar`} className="link-strong">Editar</Link>
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