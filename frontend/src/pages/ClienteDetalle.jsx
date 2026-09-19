import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCliente } from "../api/clientesApi";
import { getExpedientes } from "../api/expedientesApi";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

function getEstadoBadge(estado) {
  switch (estado) {
    case "Activo":
      return { clase: "badge-success", dot: "dot-success" };
    case "En trámite":
      return { clase: "badge-info", dot: "dot-info" };
    case "Cerrado":
      return { clase: "badge-danger", dot: "dot-danger" };
    case "Archivado":
      return { clase: "badge-warning", dot: "dot-warning" };
    default:
      return { clase: "badge-neutral", dot: "" };
  }
}

export default function ClienteDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const puedeEditar = user?.role === "Admin" || user?.puedeEditarClientes === true;

  const [cliente, setCliente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCliente(id), getExpedientes()])
      .then(([clienteRes, expedientesRes]) => {
        setCliente(clienteRes.data);
        setExpedientes(
          expedientesRes.data.filter((e) => e.clienteId === Number(id) || e.cliente?.id === Number(id))
        );
      })
      .catch(() => setError("No se pudo cargar el cliente"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!cliente) return null;

  const expedientesActivos = expedientes.filter((e) => e.estado === "Activo" || e.estado === "En trámite").length;

  return (
    <div>
      <BackButton />

      <div className="detail-header">
        <div className="detail-title-row">
          <div className="client-avatar" style={{ width: 48, height: 48, fontSize: 17 }}>
            {iniciales(cliente.nombre, cliente.apellido)}
          </div>
          <div>
            <h2>{cliente.nombre} {cliente.apellido}</h2>
            <div className="detail-subtitle">Cliente desde {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString() : "-"}</div>
          </div>
        </div>
        {puedeEditar && (
          <Link to={`/clientes/${cliente.id}/editar`}>
            <button className="btn">Editar cliente</button>
          </Link>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <div className="detail-label">DNI</div>
          <div className="detail-value">{cliente.dni || "-"}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Email</div>
          <div className="detail-value">{cliente.email || "-"}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Teléfono</div>
          <div className="detail-value">{cliente.telefono || "-"}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Expedientes activos</div>
          <div className="detail-value">{expedientesActivos} de {expedientes.length}</div>
        </div>
      </div>

      <div className="detail-section card">
        <h3>Expedientes</h3>
        {expedientes.length > 0 ? (
          expedientes.map((e) => {
            const estado = getEstadoBadge(e.estado);
            return (
              <Link to={`/expedientes/${e.id}`} key={e.id} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="task-row">
                  <div>
                    <div className="task-title">{e.caratula}</div>
                    <div className="task-due">N.º {e.numero}</div>
                  </div>
                  <span className={`badge ${estado.clase}`}>
                    {estado.dot && <span className={`badge-dot ${estado.dot}`}></span>}
                    {e.estado}
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="empty-state">Este cliente no tiene expedientes cargados todavía.</p>
        )}
      </div>
    </div>
  );
}