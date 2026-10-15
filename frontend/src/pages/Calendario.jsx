import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTareas } from "../api/tareasApi";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function claseDeTarea(tarea) {
  if (tarea.completada) return "hecha";
  if (new Date(tarea.fechaVencimiento) < new Date()) return "vencida";
  return "pendiente";
}

function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Calendario() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  useEffect(() => {
    getTareas()
      .then((response) => setTareas(response.data))
      .catch(() => setError("No se pudieron cargar las tareas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando calendario...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  const hoy = new Date();
  const anio = mes.getFullYear();
  const numeroMes = mes.getMonth();
  // La semana arranca en lunes: getDay() devuelve 0 para domingo
  const huecos = (mes.getDay() + 6) % 7;
  const diasDelMes = new Date(anio, numeroMes + 1, 0).getDate();
  const textoMes = mes.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const nombreMes = textoMes.charAt(0).toUpperCase() + textoMes.slice(1);

  const cambiarMes = (delta) => setMes(new Date(anio, numeroMes + delta, 1));

  return (
    <div>
      <div className="page-header">
        <h2>Calendario</h2>
      </div>

      <div className="card">
        <div className="cal-head">
          <button className="icon-btn" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
          <h3 className="card-title cal-mes">{nombreMes}</h3>
          <button className="icon-btn" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
        </div>

        <div className="cal-grid">
          {DIAS.map((d) => (
            <small key={d} className="cal-dia-nombre">{d}</small>
          ))}

          {Array.from({ length: huecos }, (_, i) => (
            <div key={`hueco-${i}`} className="cal-celda vacia" />
          ))}

          {Array.from({ length: diasDelMes }, (_, i) => {
            const fecha = new Date(anio, numeroMes, i + 1);
            const delDia = tareas.filter((t) => mismoDia(new Date(t.fechaVencimiento), fecha));
            return (
              <div key={i + 1} className={`cal-celda${mismoDia(fecha, hoy) ? " hoy" : ""}`}>
                <b>{i + 1}</b>
                {delDia.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`cal-chip ${claseDeTarea(t)}`}
                    title={t.titulo}
                    onClick={() => navigate(`/tareas/${t.id}`)}
                  >
                    {t.titulo}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
