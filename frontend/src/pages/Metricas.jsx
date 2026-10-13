import { useEffect, useState } from "react";
import { getClientes } from "../api/clientesApi";
import { getExpedientes } from "../api/expedientesApi";
import { getTareas } from "../api/tareasApi";
import { getMovimientosPorExpediente } from "../api/movimientosApi";

const MESES_ACTIVIDAD = 6;

// Colores de las barras de "Expedientes por estado"
const COLORES_BARRAS = ["#60A5FA", "#22D3EE", "#818CF8", "#2DD4BF", "#FBBF24"];

function kpi(valor, etiqueta) {
  return (
    <div className="kpi">
      <div style={{ minWidth: 0 }}>
        <div className="kpi-value">{valor}</div>
        <div className="kpi-sub">{etiqueta}</div>
      </div>
    </div>
  );
}

// Cantidad de movimientos en cada uno de los últimos meses (incluye meses en cero)
function movimientosPorMes(movimientos) {
  const hoy = new Date();
  const meses = [];
  for (let i = MESES_ACTIVIDAD - 1; i >= 0; i--) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      anio: inicio.getFullYear(),
      mes: inicio.getMonth(),
      label: inicio.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
      value: 0,
    });
  }

  movimientos.forEach((m) => {
    const f = new Date(m.fecha);
    const mes = meses.find((x) => x.anio === f.getFullYear() && x.mes === f.getMonth());
    if (mes) mes.value++;
  });

  return meses;
}

export default function Metricas() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getExpedientes(), getClientes(), getTareas(), getMovimientosPorExpediente()])
      .then(([expedientesRes, clientesRes, tareasRes, movimientosRes]) => {
        setDatos({
          expedientes: expedientesRes.data,
          clientes: clientesRes.data,
          tareas: tareasRes.data,
          movimientos: movimientosRes.data,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-state">Cargando métricas...</p>;
  if (error || !datos) return <p className="empty-state">No se pudieron cargar las métricas. Probá recargar la página.</p>;

  const { expedientes, clientes, tareas, movimientos } = datos;

  const completadas = tareas.filter((t) => t.completada).length;
  const pendientes = tareas.length - completadas;
  const porcentaje = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

  const porEstado = {};
  expedientes.forEach((e) => {
    const estado = e.estado || "Sin estado";
    porEstado[estado] = (porEstado[estado] || 0) + 1;
  });
  const estados = Object.entries(porEstado).sort((a, b) => b[1] - a[1]);
  const maxEstado = Math.max(1, ...estados.map(([, n]) => n));

  const meses = movimientosPorMes(movimientos);
  const maxMes = Math.max(1, ...meses.map((m) => m.value));

  return (
    <div>
      <div className="page-header">
        <h2>Métricas</h2>
      </div>

      <div className="kpi-row">
        {kpi(expedientes.length, "Expedientes totales")}
        {kpi(movimientos.length, "Movimientos recientes")}
        {kpi(`${porcentaje}%`, "Cumplimiento de tareas")}
        {kpi(clientes.length ? (expedientes.length / clientes.length).toFixed(1) : "0", "Expedientes por cliente")}
      </div>

      <div className="metricas-grid">
        <div className="card">
          <h3 className="card-title">Expedientes por estado</h3>
          {estados.length === 0 ? (
            <p className="empty-state">Todavía no hay expedientes.</p>
          ) : (
            <div className="bars-chart">
              {estados.map(([estado, n], i) => (
                <div key={estado} className="bar-row">
                  <span className="bar-label">{estado}</span>
                  <span className="bar-track">
                    <i style={{ width: `${(n / maxEstado) * 100}%`, background: COLORES_BARRAS[i % COLORES_BARRAS.length] }} />
                  </span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Estado de tareas</h3>
          <div className="donut-wrap">
            <div
              className="donut"
              style={{ background: `conic-gradient(var(--card-top) ${porcentaje}%, var(--color-primary-light) 0)` }}
            >
              <div>{porcentaje}%</div>
            </div>
            <div className="donut-legend">
              <span className="badge badge-success">{completadas} cumplidas</span>
              <span className="badge badge-warning">{pendientes} pendientes</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Actividad mensual (movimientos)</h3>
          <div className="cols-chart">
            {meses.map((m) => (
              <div key={`${m.anio}-${m.mes}`} className="cols-col">
                <i style={{ height: `${(m.value / maxMes) * 110}px` }} title={`${m.value} movimientos`} />
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
