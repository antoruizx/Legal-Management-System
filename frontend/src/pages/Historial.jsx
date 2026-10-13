import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMovimientosPorExpediente } from "../api/movimientosApi";
import { getExpedientes } from "../api/expedientesApi";

export default function Historial() {
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMovimientosPorExpediente(), getExpedientes()])
      .then(([movimientosRes, expedientesRes]) => {
        // El endpoint de movimientos no incluye el expediente: se cruza por id
        const porId = new Map(expedientesRes.data.map((e) => [e.id, e]));
        setMovimientos(movimientosRes.data.map((m) => ({ ...m, expediente: porId.get(m.expedienteId) })));
      })
      .catch(() => setError("No se pudo cargar el historial"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando historial...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Historial</h2>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Movimiento</th>
              <th>Expediente</th>
              <th>Cliente</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr
                key={m.id}
                className="clickable-row"
                onClick={() => navigate(`/expedientes/${m.expedienteId}`)}
              >
                <td data-label="Fecha">{new Date(m.fecha).toLocaleDateString()}</td>
                <td data-label="Movimiento" style={{ color: "var(--text-hi)", fontWeight: 500 }}>
                  {m.tipo}: {m.descripcion}
                </td>
                <td data-label="Expediente">
                  {m.expediente ? (
                    <Link
                      to={`/expedientes/${m.expediente.id}`}
                      className="link-action"
                      style={{ color: "var(--link)", fontWeight: 600 }}
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      {m.expediente.numero}
                    </Link>
                  ) : "-"}
                </td>
                <td data-label="Cliente">
                  {m.expediente?.cliente ? `${m.expediente.cliente.nombre} ${m.expediente.cliente.apellido}` : "-"}
                </td>
                <td data-label="Usuario">{m.user ? `${m.user.firstName} ${m.user.lastName}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {movimientos.length === 0 && <p className="empty-state">Todavía no hay movimientos registrados.</p>}
      </div>
    </div>
  );
}
