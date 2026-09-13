import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getClientes } from "../api/clientesApi";
import { getExpedientes } from "../api/expedientesApi";
import { getTareas } from "../api/tareasApi";

function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getEstadoTarea(tarea) {
  const hoy = new Date();
  const vencimiento = new Date(tarea.fechaVencimiento);
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

  if (diffDias < 0) return { label: "Urgente", clase: "badge-danger" };
  if (diffDias <= 3) return { label: "Próxima", clase: "badge-warning" };
  return { label: "Pendiente", clase: "badge-info" };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [clientesCount, setClientesCount] = useState(0);
  const [expedientesCount, setExpedientesCount] = useState(0);
  const [tareasCount, setTareasCount] = useState(0);
  const [proximasTareas, setProximasTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClientes(), getExpedientes(), getTareas()])
      .then(([clientesRes, expedientesRes, tareasRes]) => {
        setClientesCount(clientesRes.data.length);
        setExpedientesCount(expedientesRes.data.length);

        const pendientes = tareasRes.data.filter((t) => !t.completada);
        setTareasCount(pendientes.length);

        const ordenadas = [...pendientes].sort(
          (a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
        );
        setProximasTareas(ordenadas.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>{saludoSegunHora()}, {user?.firstName} 👋</h2>
      <p style={{ color: "var(--text-lo)", marginTop: "4px" }}>Resumen de tu estudio</p>

      {loading ? (
        <p>Cargando resumen...</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "16px", margin: "24px 0", flexWrap: "wrap" }}>
            <div className="stat-card">
              <div className="value">{clientesCount}</div>
              <div className="label">Clientes</div>
            </div>
            <div className="stat-card">
              <div className="value">{expedientesCount}</div>
              <div className="label">Expedientes</div>
            </div>
            <div className="stat-card">
              <div className="value">{tareasCount}</div>
              <div className="label">Tareas</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: "12px" }}>Próximos vencimientos</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {proximasTareas.map((t) => {
                  const estado = getEstadoTarea(t);
                  return (
                    <tr key={t.id}>
                      <td data-label="Tarea">{t.titulo}</td>
                      <td data-label="Fecha">{new Date(t.fechaVencimiento).toLocaleDateString()}</td>
                      <td data-label="Estado">
                        <span className={`badge ${estado.clase}`}>{estado.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {proximasTareas.length === 0 && <p className="empty-state">No hay tareas pendientes próximas.</p>}
          </div>
        </>
      )}
    </div>
  );
}