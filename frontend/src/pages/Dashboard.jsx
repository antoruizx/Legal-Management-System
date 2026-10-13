import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getClientes } from "../api/clientesApi";
import { getExpedientes } from "../api/expedientesApi";
import { getTareas } from "../api/tareasApi";
import StatCard from "../components/StatCard";
import AreaChart from "../components/AreaChart";

// Datos de ejemplo: la API todavía no tiene audiencias ni honorarios.
// Cuando existan los endpoints, reemplazar por la respuesta real.
const DATOS_EJEMPLO = {
  audienciasSemana: 3,
  honorariosPendientes: 1250000,
};

const MESES_GRAFICO = 6;

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

  if (diffDias < 0) return { label: "Urgente", clase: "badge-danger", dot: "dot-danger" };
  if (diffDias <= 3) return { label: "Próxima", clase: "badge-warning", dot: "dot-warning" };
  return { label: "Pendiente", clase: "badge-info", dot: "dot-info" };
}

function esDelMesActual(fecha) {
  const f = new Date(fecha);
  const hoy = new Date();
  return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth();
}

// Cantidad de expedientes iniciados en cada uno de los últimos meses (incluye meses en cero)
function expedientesPorMes(expedientes) {
  const hoy = new Date();
  const meses = [];
  for (let i = MESES_GRAFICO - 1; i >= 0; i--) {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      anio: inicio.getFullYear(),
      mes: inicio.getMonth(),
      label: inicio.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
      detalle: inicio.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
      value: 0,
    });
  }

  expedientes.forEach((e) => {
    const f = new Date(e.fechaInicio || e.fechaCreacion);
    const mes = meses.find((m) => m.anio === f.getFullYear() && m.mes === f.getMonth());
    if (mes) mes.value++;
  });

  return meses;
}

function ProgressRing({ porcentaje }) {
  const radio = 48;
  const largo = 2 * Math.PI * radio;
  return (
    <div className="progress-ring">
      <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
        <circle className="ring-track" cx="56" cy="56" r={radio} fill="none" strokeWidth="10" />
        <circle
          className="ring-value"
          cx="56"
          cy="56"
          r={radio}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={largo}
          strokeDashoffset={largo * (1 - porcentaje / 100)}
        />
      </svg>
      <div className="progress-ring-label">{porcentaje}%</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getClientes(), getExpedientes(), getTareas()])
      .then(([clientesRes, expedientesRes, tareasRes]) => {
        setClientes(clientesRes.data);
        setExpedientes(expedientesRes.data);
        setTareas(tareasRes.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const expedientesActivos = expedientes.filter((e) => e.estado === "Activo");
  const clientesNuevos = clientes.filter((c) => esDelMesActual(c.fechaAlta)).length;

  const pendientes = tareas.filter((t) => !t.completada);
  const completadas = tareas.length - pendientes.length;
  const porcentajeCompletadas = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;
  const proximasTareas = [...pendientes]
    .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
    .slice(0, 5);

  const serieExpedientes = expedientesPorMes(expedientes);
  const totalPeriodo = serieExpedientes.reduce((acc, m) => acc + m.value, 0);

  const fechaHoy = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="dashboard">
      <div>
        <h2 className="page-title">{saludoSegunHora()}, {user?.firstName}</h2>
        <p className="page-subtitle">Resumen de tu estudio · {fechaHoy}</p>
      </div>

      {loading ? (
        <p className="empty-state">Cargando resumen...</p>
      ) : error ? (
        <p className="empty-state">No se pudo cargar el resumen. Probá recargar la página.</p>
      ) : (
        <>
          <div className="kpi-row">
            <StatCard
              icon="folder"
              label="Expedientes activos"
              value={expedientesActivos.length}
              sub={`${expedientes.length} en total`}
            />
            <StatCard
              icon="calendar"
              label="Audiencias esta semana"
              value={DATOS_EJEMPLO.audienciasSemana}
              sub="Todavía sin datos reales"
              ejemplo
            />
            <StatCard
              icon="users"
              label="Clientes"
              value={clientes.length}
              sub={clientesNuevos > 0 ? `${clientesNuevos} nuevos este mes` : "Sin altas este mes"}
            />
            <StatCard
              icon="wallet"
              label="Honorarios pendientes"
              value={`$ ${DATOS_EJEMPLO.honorariosPendientes.toLocaleString("es-AR")}`}
              sub="Todavía sin datos reales"
              ejemplo
            />
          </div>

          <div className="card">
            <div className="page-header" style={{ marginBottom: 0 }}>
              <div>
                <h3 className="card-title">Expedientes iniciados por mes</h3>
                <div className="card-caption">Últimos {MESES_GRAFICO} meses, según fecha de inicio</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="kpi-value" style={{ marginTop: 0 }}>{totalPeriodo}</div>
                <div className="card-caption">en el período</div>
              </div>
            </div>
            <AreaChart data={serieExpedientes} unidad="expedientes" />
          </div>

          <div className="dashboard-bottom">
            <div className="card">
              <h3 className="card-title">Tareas completadas</h3>
              <div className="progress-ring-wrap">
                <ProgressRing porcentaje={porcentajeCompletadas} />
                <div>
                  <div style={{ fontWeight: 600 }}>{completadas} de {tareas.length}</div>
                  <div className="card-caption">{pendientes.length} pendientes</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="page-header" style={{ marginBottom: "12px" }}>
                <h3 className="card-title">Próximos vencimientos</h3>
                <Link to="/tareas" className="link-action">Ver todas las tareas →</Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tarea</th>
                    <th>Expediente</th>
                    <th>Vence</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {proximasTareas.map((t) => {
                    const estado = getEstadoTarea(t);
                    return (
                      <tr key={t.id} className="clickable-row" onClick={() => navigate(`/tareas/${t.id}`)}>
                        <td data-label="Tarea">
                          <Link to={`/tareas/${t.id}`} style={{ color: "var(--text-hi)", fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>
                            {t.titulo}
                          </Link>
                        </td>
                        <td data-label="Expediente" style={{ color: "var(--text-lo)" }}>{t.expediente?.numero || "-"}</td>
                        <td data-label="Vence">{new Date(t.fechaVencimiento).toLocaleDateString()}</td>
                        <td data-label="Estado">
                          <span className={`badge ${estado.clase}`}>
                            <span className={`badge-dot ${estado.dot}`}></span>
                            {estado.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {proximasTareas.length === 0 && <p className="empty-state">No hay tareas pendientes próximas.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
