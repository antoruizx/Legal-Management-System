import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTareas } from "../api/tareasApi";

function clasificar(tarea) {
  const hoy = new Date();
  const vencimiento = new Date(tarea.fechaVencimiento);
  const diffDias = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

  if (diffDias < 0) return "vencida";
  if (diffDias <= 3) return "proxima";
  return "ok";
}

export default function NotificationBell() {
  const [abierto, setAbierto] = useState(false);
  const [vencidas, setVencidas] = useState([]);
  const [proximas, setProximas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getTareas().then((response) => {
      const pendientes = response.data.filter((t) => !t.completada);
      setVencidas(pendientes.filter((t) => clasificar(t) === "vencida"));
      setProximas(pendientes.filter((t) => clasificar(t) === "proxima"));
    });
  }, []);

  const total = vencidas.length + proximas.length;

  const irATarea = (id) => {
    setAbierto(false);
    navigate(`/tareas/${id}`);
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" onClick={() => setAbierto(!abierto)} style={{ position: "relative" }}>
        🔔
        {total > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "var(--danger)",
              color: "white",
              fontSize: "10px",
              fontWeight: 600,
              borderRadius: "999px",
              padding: "1px 5px",
              lineHeight: 1.4,
            }}
          >
            {total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="user-menu-dropdown" style={{ minWidth: "280px" }}>
          <div className="info" style={{ fontWeight: 600 }}>Notificaciones</div>

          {total === 0 ? (
            <div style={{ padding: "16px 14px", fontSize: "13px", color: "var(--success)" }}>
              ✅ Estás al día, no hay vencimientos próximos.
            </div>
          ) : (
            <div style={{ maxHeight: "260px", overflowY: "auto" }}>
              {vencidas.map((t) => (
                <button key={t.id} onClick={() => irATarea(t.id)} style={notifItemStyle}>
                  <span className="badge-dot" style={{ background: "var(--danger)" }} />
                  <div style={{ textAlign: "left" }}>
                    <div>{t.titulo}</div>
                    <small style={{ color: "var(--text-lo)" }}>
                      Venció el {new Date(t.fechaVencimiento).toLocaleDateString()}
                    </small>
                  </div>
                </button>
              ))}

              {proximas.map((t) => (
                <button key={t.id} onClick={() => irATarea(t.id)} style={notifItemStyle}>
                  <span className="badge-dot" style={{ background: "var(--warning)" }} />
                  <div style={{ textAlign: "left" }}>
                    <div>{t.titulo}</div>
                    <small style={{ color: "var(--text-lo)" }}>
                      Vence el {new Date(t.fechaVencimiento).toLocaleDateString()}
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