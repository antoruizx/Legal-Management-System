import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const WHATSAPP_NUMERO = "5493814988682";

const FUNCIONES_PREMIUM = [
  {
    id: "asistente",
    icono: "🤖",
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
    icono: "📊",
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
    icono: "💬",
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
    icono: "👤",
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
    icono: "✍️",
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
    icono: "📈",
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
        <NavLink to="/dashboard" className={linkClass} onClick={onClose}>Dashboard</NavLink>
        <NavLink to="/clientes" className={linkClass} onClick={onClose}>Clientes</NavLink>
        <NavLink to="/expedientes" className={linkClass} onClick={onClose}>Expedientes</NavLink>
        <NavLink to="/tareas" className={linkClass} onClick={onClose}>Tareas</NavLink>

        <hr className="sidebar-divider" />
        <div style={{ padding: "8px 16px 4px", fontSize: 12, color: "var(--text-lo)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          Funciones adicionales
        </div>

        {FUNCIONES_PREMIUM.map((f) => (
          <button
            key={f.id}
            className="sidebar-link"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              opacity: 0.75,
            }}
            onClick={() => setFuncionSeleccionada(f)}
          >
            <span>{f.icono} {f.nombre}</span>
            <span>🔒</span>
          </button>
        ))}
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
            <div style={{ fontSize: 32, marginBottom: 8 }}>{funcionSeleccionada.icono}</div>
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