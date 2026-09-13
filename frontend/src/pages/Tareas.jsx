import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTareas, updateTarea, deleteTarea } from "../api/tareasApi";
import BackButton from "../components/BackButton";

function getEstadoTarea(tarea) {
  if (tarea.completada) return { label: "Completada", color: "#16a34a" };

  const hoy = new Date();
  const vencimiento = new Date(tarea.fechaVencimiento);
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

  if (diffDias < 0) return { label: "Vencida", color: "#dc2626" };
  if (diffDias <= 3) return { label: "Próxima a vencer", color: "#d97706" };
  return { label: "Pendiente", color: "#2563eb" };
}

export default function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("Todas");

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

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que querés eliminar esta tarea?")) return;
    try {
      await deleteTarea(id);
      cargarTareas();
    } catch (err) {
      alert("No se pudo eliminar la tarea");
    }
  };

  if (loading) return <p>Cargando tareas...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

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
      <BackButton />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Tareas</h2>
        <Link to="/tareas/nuevo">
          <button>+ Nueva Tarea</button>
        </Link>
      </div>

      {(vencidas > 0 || proximas > 0) && (
        <div style={{ margin: "15px 0", padding: "10px", backgroundColor: "#fef3c7", borderRadius: "6px" }}>
          {vencidas > 0 && <p style={{ margin: 0, color: "#dc2626" }}>⚠️ Tenés {vencidas} tarea(s) vencida(s)</p>}
          {proximas > 0 && <p style={{ margin: 0, color: "#d97706" }}>⏰ Tenés {proximas} tarea(s) próxima(s) a vencer</p>}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
        {["Todas", "Pendientes", "Vencidas", "Completadas"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 12px",
              backgroundColor: filtro === f ? "#1f2937" : "#e5e7eb",
              color: filtro === f ? "white" : "#1f2937",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Título</th>
            <th>Expediente</th>
            <th>Responsable</th>
            <th>Vencimiento</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tareasFiltradas.map((t) => {
            const estado = getEstadoTarea(t);
            return (
              <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td><Link to={`/tareas/${t.id}`}>{t.titulo}</Link></td>
                <td>{t.expediente ? t.expediente.caratula : "-"}</td>
                <td>{t.user ? `${t.user.firstName} ${t.user.lastName}` : "-"}</td>
                <td>{new Date(t.fechaVencimiento).toLocaleDateString()}</td>
                <td>
                  <span
                    style={{
                      backgroundColor: estado.color,
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {estado.label}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleToggleCompletada(t)}>
                    {t.completada ? "Marcar pendiente" : "Marcar completada"}
                  </button>
                  {" | "}
                  <Link to={`/tareas/${t.id}/editar`}>Editar</Link>
                  {" | "}
                  <button onClick={() => handleDelete(t.id)}>Eliminar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tareasFiltradas.length === 0 && <p>No hay tareas para este filtro.</p>}
    </div>
  );
}