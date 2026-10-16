import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const WHATSAPP_NUMERO = "5493814988682";

const FUNCIONES_PREMIUM = [
  {
    id: "asistente",
    icono: "bot",
    nombre: "Asistente virtual",
    descripcion: "Un asistente con inteligencia artificial integrado al sistema, que responde preguntas sobre tus clientes, expedientes y tareas en lenguaje natural.",
    beneficios: [
      "Consultá el estado de un caso sin buscar manualmente",
      "Resúmenes automáticos de expedientes largos",
      "Redacción asistida de escritos y notificaciones",
    ],
  },
  {
    id: "crm",
    icono: "chart",
    nombre: "CRM",
    descripcion: "Gestión de potenciales clientes (leads) desde el primer contacto hasta que se convierten en clientes del estudio.",
    beneficios: [
      "Seguimiento de consultas antes de firmar",
      "Historial de contacto con cada interesado",
      "Nunca perder una oportunidad por falta de seguimiento",
    ],
  },
  {
    id: "whatsapp",
    icono: "message",
    nombre: "Recordatorios por WhatsApp",
    descripcion: "Los recordatorios de tareas y notas se envían directo al WhatsApp del responsable, además del email.",
    beneficios: [
      "Avisos donde realmente se leen a tiempo",
      "Menos vencimientos olvidados",
      "Configuración simple, sin apps extra",
    ],
  },
  {
    id: "portal-cliente",
    icono: "user",
    nombre: "Portal del cliente",
    descripcion: "Un acceso limitado para que tus clientes vean el estado de su propio expediente, sin llamar al estudio.",
    beneficios: [
      "Menos llamadas preguntando '¿cómo va mi caso?'",
      "Imagen más profesional frente al cliente",
      "Acceso de solo lectura, sin riesgo para tus datos",
    ],
  },
  {
    id: "firma-digital",
    icono: "pen",
    nombre: "Firma digital de documentos",
    descripcion: "Tus clientes pueden firmar documentos subidos al sistema directamente desde su celular o computadora.",
    beneficios: [
      "Sin imprimir, escanear ni enviar por separado",
      "Todo queda guardado junto al expediente",
      "Procesos más rápidos con clientes a distancia",
    ],
  },
  {
    id: "reportes",
    icono: "trending",
    nombre: "Reportes y estadísticas avanzadas",
    descripcion: "Gráficos y métricas sobre la actividad del estudio: carga de trabajo por abogado, expedientes por estado, tiempos promedio de resolución.",
    beneficios: [
      "Decisiones basadas en datos reales",
      "Detectá cuellos de botella en el equipo",
      "Exportable para presentar a socios o clientes",
    ],
  },
];

function armarLinkWhatsapp(nombreFuncion) {
  const texto = `Me interesa agregar esta función a mi sistema: ${nombreFuncion}. Quiero información.`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

export default function Sidebar({ open, onClose }) {
  const linkClass = ({ isActive }) => `sidebar-link${isActive ? " active" : ""}`;
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    function handleAbrirModal(e) {
      const funcion = FUNCIONES_PREMIUM.find((f) => f.id === e.detail);
      if (funcion) setFuncionSeleccionada(funcion);
    }
    window.addEventListener("abrir-modal-premium", handleAbrirModal);
    return () => window.removeEventListener("abrir-modal-premium", handleAbrirModal);
  }, []);

  const linkWhatsapp = funcionSeleccionada ? armarLinkWhatsapp(funcionSeleccionada.nombre) : "#";

  return (
    <>
      <div className={`sidebar-overlay${open ? " visible" : ""}`} onClick={onClose} />
      <div className={`sidebar${open ? " open" : ""}`}>
        <Logo />

        <NavLink to="/dashboard" className={linkClass} onClick={onClose}><Icon name="home" /> Panel</NavLink>
        <NavLink to="/clientes" className={linkClass} onClick={onClose}><Icon name="users" /> Clientes</NavLink>
        <NavLink to="/expedientes" className={linkClass} onClick={onClose}><Icon name="folder" /> Expedientes</NavLink>
        <NavLink to="/tareas" className={linkClass} onClick={onClose}><Icon name="tasks" /> Tareas</NavLink>
        <NavLink to="/honorarios" className={linkClass} onClick={onClose}><Icon name="wallet" /> Honorarios</NavLink>
        <NavLink to="/calendario" className={linkClass} onClick={onClose}><Icon name="calendar" /> Calendario</NavLink>
        <NavLink to="/historial" className={linkClass} onClick={onClose}><Icon name="clock" /> Historial</NavLink>
        <NavLink to="/metricas" className={linkClass} onClick={onClose}><Icon name="chart" /> Métricas</NavLink>
        {user?.esSuperAdmin && (
          <NavLink to="/estudios" className={linkClass} onClick={onClose}><Icon name="folder" /> Estudios</NavLink>
        )}
        {(user?.esSuperAdmin || user?.esVendedor) && (
          <NavLink to="/codigos" className={linkClass} onClick={onClose}><Icon name="key" /> Códigos de prueba</NavLink>
        )}

        <hr className="sidebar-divider" />
        <div className="sidebar-label">Funciones adicionales</div>

        {FUNCIONES_PREMIUM.map((f) => (
          <button key={f.id} className="sidebar-link" onClick={() => setFuncionSeleccionada(f)}>
            <Icon name={f.icono} />
            {f.nombre}
            <span className="sidebar-lock"><Icon name="lock" size={14} /></span>
          </button>
        ))}

        {user?.tenantName && <div className="sidebar-footer">{user.tenantName}</div>}
      </div>

      {funcionSeleccionada && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setFuncionSeleccionada(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: "90%", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kpi-icon" style={{ marginBottom: 12 }}><Icon name={funcionSeleccionada.icono} size={22} /></div>
            <h3 style={{ marginBottom: 8 }}>{funcionSeleccionada.nombre}</h3>
            <p style={{ color: "var(--text-lo)", fontSize: 14, marginBottom: 16 }}>
              {funcionSeleccionada.descripcion}
            </p>

            <div style={{ marginBottom: 20 }}>
              {funcionSeleccionada.beneficios.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 14, marginBottom: 6 }}>
                  <span>✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <a href={linkWhatsapp} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", background: "#25D366", borderColor: "#25D366", marginBottom: 8 }}>
              💬 Consultar por WhatsApp
            </a>
            <button className="btn" style={{ width: "100%" }} onClick={() => setFuncionSeleccionada(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}