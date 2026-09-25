import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExpediente, updateExpediente } from "../api/expedientesApi";
import {
  getDocumentosPorExpediente,
  subirDocumento,
  descargarDocumentoUrl,
  eliminarDocumento,
} from "../api/documentosApi";
import {
  getMovimientosPorExpediente,
  crearMovimiento,
  eliminarMovimiento,
} from "../api/movimientosApi";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

const ESTADOS = ["Activo", "En trámite", "Cerrado", "Archivado"];
const TIPOS_MOVIMIENTO = ["Presentación", "Notificación", "Audiencia", "Resolución", "Otro"];

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

function formatFechaHora(fecha) {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const esAdmin = user?.role === "Admin";
  const puedeEditar = esAdmin || user?.puedeEditarExpedientes === true;
  const puedeEliminar = esAdmin || user?.puedeEliminarExpedientes === true;

  const [expediente, setExpediente] = useState(null);
  const [error, setError] = useState("");
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [movimientos, setMovimientos] = useState([]);
  const [tipoMov, setTipoMov] = useState(TIPOS_MOVIMIENTO[0]);
  const [descripcionMov, setDescripcionMov] = useState("");
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [errorMov, setErrorMov] = useState("");

  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [descripcionDoc, setDescripcionDoc] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorDoc, setErrorDoc] = useState("");

  const cargarExpediente = () => {
    getExpediente(id)
      .then((response) => setExpediente(response.data))
      .catch(() => setError("No se pudo cargar el expediente"));
  };

  const cargarDocumentos = () => {
    getDocumentosPorExpediente(id).then((response) => setDocumentos(response.data));
  };

  const cargarMovimientos = () => {
    getMovimientosPorExpediente(id).then((response) => setMovimientos(response.data));
  };

  useEffect(() => {
    cargarExpediente();
    cargarDocumentos();
    cargarMovimientos();
  }, [id]);

  // Cambiar el estado es una acción permitida para todos los usuarios,
  // independientemente de los permisos de edición/eliminación.
  const handleCambiarEstado = async (nuevoEstado) => {
    if (!expediente || nuevoEstado === expediente.estado) return;
    setCambiandoEstado(true);
    try {
      const payload = { ...expediente, estado: nuevoEstado };
      await updateExpediente(id, payload);
      setExpediente(payload);
    } catch (err) {
      alert("No se pudo actualizar el estado del expediente");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleCrearMovimiento = async (e) => {
    e.preventDefault();
    if (!descripcionMov.trim()) return;

    setGuardandoMov(true);
    setErrorMov("");
    try {
      await crearMovimiento({
        expedienteId: Number(id),
        userId: user.id,
        tipo: tipoMov,
        descripcion: descripcionMov,
      });
      setDescripcionMov("");
      setTipoMov(TIPOS_MOVIMIENTO[0]);
      cargarMovimientos();
    } catch (err) {
      setErrorMov("No se pudo registrar el movimiento.");
    } finally {
      setGuardandoMov(false);
    }
  };

  const handleEliminarMovimiento = async (movId) => {
    if (!confirm("¿Eliminar este movimiento del historial?")) return;
    try {
      await eliminarMovimiento(movId);
      cargarMovimientos();
    } catch (err) {
      alert("No se pudo eliminar el movimiento");
    }
  };

  const handleSubirDocumento = async (e) => {
    e.preventDefault();
    if (!archivo) return;

    setSubiendo(true);
    setErrorDoc("");
    try {
      await subirDocumento(id, archivo, descripcionDoc);
      setArchivo(null);
      setDescripcionDoc("");
      e.target.reset();
      cargarDocumentos();
    } catch (err) {
      setErrorDoc("No se pudo subir el documento.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminarDocumento = async (docId) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await eliminarDocumento(docId);
      cargarDocumentos();
    } catch (err) {
      alert("No se pudo eliminar el documento");
    }
  };

  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!expediente) return <p>Cargando...</p>;

  const estadoBadge = getEstadoBadge(expediente.estado);

  return (
    <div>
      <BackButton />

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <h2>{expediente.caratula}</h2>
            <span className={`badge ${estadoBadge.clase}`}>
              {estadoBadge.dot && <span className={`badge-dot ${estadoBadge.dot}`}></span>}
              {expediente.estado}
            </span>
          </div>
          <div className="detail-subtitle">Expediente N.º {expediente.numero}</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={expediente.estado}
            onChange={(e) => handleCambiarEstado(e.target.value)}
            disabled={cambiandoEstado}
            title="Cambiar estado"
          >
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          {puedeEditar && (
            <Link to={`/expedientes/${expediente.id}/editar`}>
              <button className="btn">Editar expediente</button>
            </Link>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <div className="detail-label">Cliente</div>
          <div className="detail-value">
            {expediente.cliente ? `${expediente.cliente.nombre} ${expediente.cliente.apellido}` : "-"}
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Fecha de inicio</div>
          <div className="detail-value">{new Date(expediente.fechaInicio).toLocaleDateString()}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Movimientos</div>
          <div className="detail-value">{movimientos.length}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Documentos</div>
          <div className="detail-value">{documentos.length}</div>
        </div>
      </div>

      <div className="detail-section card">
        <h3>Movimientos</h3>

        {puedeEditar && (
          <form onSubmit={handleCrearMovimiento} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
              {TIPOS_MOVIMIENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Descripción del movimiento"
              value={descripcionMov}
              onChange={(e) => setDescripcionMov(e.target.value)}
              required
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                color: "var(--text-hi)",
                fontSize: "13px",
                flex: 1,
                minWidth: "200px",
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={guardandoMov}>
              {guardandoMov ? "Guardando..." : "Registrar movimiento"}
            </button>
          </form>
        )}

        {errorMov && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{errorMov}</p>}

        {movimientos.length > 0 ? (
          <div className="timeline">
            {movimientos.map((m) => (
              <div className="timeline-item" key={m.id}>
                <div className="timeline-meta">{formatFechaHora(m.fecha)}</div>
                <div className="timeline-title">{m.tipo}</div>
                <div className="timeline-desc">{m.descripcion}</div>
                <div style={{ fontSize: 12, color: "var(--text-lo)", marginTop: 4 }}>
                  Registrado por {m.user ? `${m.user.firstName} ${m.user.lastName}` : "—"}
                  {puedeEliminar && (
                    <>
                      {" · "}
                      <button
                        className="btn-danger-ghost"
                        style={{ fontSize: 12, padding: "2px 6px" }}
                        onClick={() => handleEliminarMovimiento(m.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No hay movimientos cargados todavía.</p>
        )}
      </div>

      <div className="detail-section card">
        <h3>Tareas</h3>
        {expediente.tareas && expediente.tareas.length > 0 ? (
          expediente.tareas.map((t) => (
            <Link to={`/tareas/${t.id}`} key={t.id} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="task-row">
                <div>
                  <div className="task-title">{t.titulo}</div>
                  <div className="task-due">Vence: {new Date(t.fechaVencimiento).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${t.completada ? "badge-success" : "badge-warning"}`}>
                  <span className={`badge-dot ${t.completada ? "dot-success" : "dot-warning"}`}></span>
                  {t.completada ? "Completada" : "Pendiente"}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="empty-state">No hay tareas cargadas todavía.</p>
        )}
      </div>

      <div className="detail-section card">
        <h3>
          📎 Documentos {!puedeEditar && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>Solo lectura</span>}
        </h3>

        {puedeEditar && (
          <form onSubmit={handleSubirDocumento} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files[0])}
              required
              style={{ color: "var(--text-hi)", fontSize: "13px" }}
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={descripcionDoc}
              onChange={(e) => setDescripcionDoc(e.target.value)}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                color: "var(--text-hi)",
                fontSize: "13px",
                flex: 1,
                minWidth: "160px",
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={subiendo}>
              {subiendo ? "Subiendo..." : "Subir documento"}
            </button>
          </form>
        )}

        {errorDoc && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{errorDoc}</p>}

        {documentos.length > 0 ? (
          documentos.map((d) => (
            <div className="task-row" key={d.id}>
              <div>
                <div className="task-title">📄 {d.nombreOriginal}</div>
                <div className="task-due">
                  {d.descripcion ? `${d.descripcion} · ` : ""}
                  Subido el {new Date(d.fechaSubida).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <a href={descargarDocumentoUrl(d.id)} target="_blank" rel="noreferrer" className="link-action">
                  Descargar
                </a>
                {puedeEliminar && (
                  <button className="btn-danger-ghost" onClick={() => handleEliminarDocumento(d.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No hay documentos adjuntos todavía.</p>
        )}
      </div>
    </div>
  );
}