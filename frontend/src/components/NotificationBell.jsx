import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTareas } from "../api/tareasApi";
import { diasParaVencer, getEstadoTarea } from "../utils/tareas";
import Icon from "./Icon";

function textoVencimiento(tarea) {
  const dias = diasParaVencer(tarea);
  const fecha = new Date(tarea.fechaVencimiento).toLocaleDateString();
  if (dias < 0) return `Venció el ${fecha}`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence el ${fecha}`;
}

export default function NotificationBell() {
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getTareas()
      .then((response) => {
        // Avisa de todo lo que ya venció o vence en los próximos 7 días, lo más atrasado primero
        const pendientes = response.data
          .map((t) => ({ ...t, estado: getEstadoTarea(t) }))
          .filter((t) => ["vencida", "urgente", "proxima"].includes(t.estado.clave))
          .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
        setAvisos(pendientes);
      })
      .catch(() => {
        // sin conexión: la campanita queda vacía
      });
  }, []);

  const irATarea = (id) => {
    setAbierto(false);
    navigate(`/tareas/${id}`);
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" onClick={() => setAbierto(!abierto)} style={{ position: "relative" }} aria-label="Notificaciones">
        <Icon name="bell" size={20} />
        {avisos.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "var(--danger)",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              borderRadius: "999px",
              padding: "1px 5px",
              lineHeight: 1.4,
            }}
          >
            {avisos.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="user-menu-dropdown" style={{ minWidth: "300px" }}>
          <div className="info" style={{ fontWeight: 600 }}>Notificaciones</div>

          {avisos.length === 0 ? (
            <div style={{ padding: "16px 14px", fontSize: "13px", color: "var(--success)" }}>
              Estás al día, no hay vencimientos próximos.
            </div>
          ) : (
            <div style={{ maxHeight: "340px", overflowY: "auto" }}>
              {avisos.map((t) => (
                <button key={t.id} onClick={() => irATarea(t.id)} style={notifItemStyle}>
                  <span className={`badge-dot ${t.estado.dot}`} style={{ marginTop: 6, flexShrink: 0 }} />
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{t.titulo}</div>
                    <small style={{ color: "var(--text-lo)" }}>
                      {textoVencimiento(t)}
                      {t.expediente ? ` · ${t.expediente.numero}` : ""}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const notifItemStyle = {
  width: "100%",
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "10px 14px",
  background: "none",
  border: "none",
  borderBottom: "1px solid var(--border-subtle)",
  cursor: "pointer",
  color: "var(--text-hi)",
  fontSize: "13px",
};
