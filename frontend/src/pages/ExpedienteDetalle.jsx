import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExpediente, updateExpediente } from "../api/expedientesApi";
import {
  getDocumentosPorExpediente,
  subirDocumento,
  descargarDocumento,
  eliminarDocumento,
} from "../api/documentosApi";
import {
  getMovimientosPorExpediente,
  crearMovimiento,
  eliminarMovimiento,
} from "../api/movimientosApi";
import { updateTarea } from "../api/tareasApi";
import BackButton from "../components/BackButton";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { getEstadoTarea } from "../utils/tareas";

const ESTADOS = ["Activo", "En trámite", "Cerrado", "Archivado"];
const TIPOS_MOVIMIENTO = ["Presentación", "Notificación", "Audiencia", "Resolución", "Otro"];

function getEstadoBadge(estado) {
  switch (estado) {
    case "Activo":
      return "badge-success";
    case "En trámite":
      return "badge-info";
    case "Cerrado":
      return "badge-danger";
    case "Archivado":
      return "badge-warning";
    default:
      return "badge-neutral";
  }
}

function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatFechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function formatFechaCreacion(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (d.getFullYear() < 1900) return "-";
  return formatFecha(d);
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
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const [documentos, setDocumentos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [errorDoc, setErrorDoc] = useState("");
  const inputArchivo = useRef(null);

  const cargarExpediente = () => {
    getExpediente(id)
      .then((response) => setExpediente(response.data))
      .catch(() => setError("No se pudo cargar el expediente"));
  };

  const cargarDocumentos = () => {
    getDocumentosPorExpediente(id).then((response) => setDocumentos(response.data));
  };

  const cargarMovimientos = (desde, hasta) => {
    getMovimientosPorExpediente(id, desde || undefined, hasta || undefined).then((response) =>
      setMovimientos(response.data)
    );
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
    } catch {
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
      cargarMovimientos(filtroDesde, filtroHasta);
    } catch {
      setErrorMov("No se pudo registrar el movimiento.");
    } finally {
      setGuardandoMov(false);
    }
  };

  const handleEliminarMovimiento = async (movId) => {
    if (!confirm("¿Eliminar este evento del historial?")) return;
    try {
      await eliminarMovimiento(movId);
      cargarMovimientos(filtroDesde, filtroHasta);
    } catch {
      alert("No se pudo eliminar el evento");
    }
  };

  const handleLimpiarFiltro = () => {
    setFiltroDesde("");
    setFiltroHasta("");
    cargarMovimientos();
  };

  // Marcar una tarea como hecha también está permitido para todos
  const handleToggleTarea = async (tarea) => {
    try {
      await updateTarea(tarea.id, { ...tarea, completada: !tarea.completada });
      cargarExpediente();
    } catch {
      alert("No se pudo actualizar la tarea");
    }
  };

  const handleSubirDocumento = async (e) => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;

    setSubiendo(true);
    setErrorDoc("");
    try {
      await subirDocumento(id, archivo);
      cargarDocumentos();
    } catch {
      setErrorDoc("No se pudo subir el documento.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargarDocumento = async (docId, nombreOriginal) => {
    try {
      await descargarDocumento(docId, nombreOriginal);
    } catch {
      alert("No se pudo descargar el documento");
    }
  };

  const handleEliminarDocumento = async (docId) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await eliminarDocumento(docId);
      cargarDocumentos();
    } catch {
      alert("No se pudo eliminar el documento");
    }
  };

  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!expediente) return <p>Cargando...</p>;

  const tareas = [...(expediente.tareas || [])].sort(
    (a, b) => a.completada - b.completada || new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
  );

  return (
    <div>
      <div className="detail-header">
        <div>
          <BackButton />
          <div className="detail-title-row">
            <h2>{expediente.caratula}</h2>
            <span className={`badge ${getEstadoBadge(expediente.estado)}`}>{expediente.estado}</span>
          </div>
          <div className="detail-subtitle">Expediente N.º {expediente.numero}</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            className="btn"
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
          <div className="detail-value">{formatFecha(expediente.fechaInicio)}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Creado el</div>
          <div className="detail-value">{formatFechaCreacion(expediente.fechaCreacion)}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Eventos en el historial</div>
          <div className="detail-value">{movimientos.length}</div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Documentos</div>
          <div className="detail-value">{documentos.length}</div>
        </div>
      </div>

      <div className="two-cols">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Historial</h3>
            <button className="link-action" onClick={() => setMostrarFiltro(!mostrarFiltro)}>
              Filtrar por fecha
            </button>
          </div>

          {puedeEditar && (
            <form onSubmit={handleCrearMovimiento} className="inline-form">
              <select className="btn" value={tipoMov} onChange={(e) => setTipoMov(e.target.value)}>
                {TIPOS_MOVIMIENTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                className="input"
                type="text"
                placeholder="Descripción del movimiento"
                value={descripcionMov}
                onChange={(e) => setDescripcionMov(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={guardandoMov}>
                {guardandoMov ? "Guardando..." : "Agregar"}
              </button>
            </form>
          )}

          {errorMov && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{errorMov}</p>}

          {mostrarFiltro && (
            <div className="inline-form" style={{ alignItems: "center" }}>
              <span className="list-meta">Desde</span>
              <input className="input" type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
              <span className="list-meta">Hasta</span>
              <input className="input" type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
              <button className="btn" onClick={() => cargarMovimientos(filtroDesde, filtroHasta)}>Filtrar</button>
              {(filtroDesde || filtroHasta) && (
                <button className="btn" onClick={handleLimpiarFiltro}>Limpiar</button>
              )}
            </div>
          )}

          {movimientos.length > 0 ? (
            movimientos.map((m) => (
              <div className="timeline-row" key={m.id}>
                <span className="timeline-dot"></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{m.tipo}</div>
                  <div className="list-meta">
                    {formatFecha(m.fecha)}
                    {m.user ? ` · ${m.user.firstName} ${m.user.lastName}` : ""}
                  </div>
                  <div>{m.descripcion}</div>
                </div>
                {puedeEliminar && (
                  <button className="btn-danger-ghost" onClick={() => handleEliminarMovimiento(m.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="empty-state">No hay eventos para mostrar en este rango.</p>
          )}
        </div>

        <div className="col-stack">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Tareas</h3>
              <Link to="/tareas/nuevo" className="link-strong">+ Nueva</Link>
            </div>

            {tareas.length > 0 ? (
              tareas.map((t) => {
                const estado = getEstadoTarea(t);
                return (
                  <div className="list-row" key={t.id}>
                    <input
                      type="checkbox"
                      checked={t.completada}
                      onChange={() => handleToggleTarea(t)}
                      aria-label={`Marcar "${t.titulo}" como ${t.completada ? "pendiente" : "hecha"}`}
                    />
                    <Link to={`/tareas/${t.id}`} className={`list-main${t.completada ? " hecha" : ""}`}>
                      {t.titulo}
                    </Link>
                    <span className="list-meta">{formatFechaCorta(t.fechaVencimiento)}</span>
                    <span className={`badge ${estado.clase}`}>{t.completada ? "Hecha" : estado.label}</span>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No hay tareas cargadas todavía.</p>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Documentos</h3>
              {puedeEditar ? (
                <>
                  <input ref={inputArchivo} type="file" hidden onChange={handleSubirDocumento} />
                  <button className="btn btn-primary" onClick={() => inputArchivo.current.click()} disabled={subiendo}>
                    {subiendo ? "Subiendo..." : "Subir"}
                  </button>
                </>
              ) : (
                <span className="badge badge-neutral">Solo lectura</span>
              )}
            </div>

            {errorDoc && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{errorDoc}</p>}

            {documentos.length > 0 ? (
              documentos.map((d) => (
                <div className="list-row" key={d.id}>
                  <span style={{ color: "var(--link)", display: "flex" }}><Icon name="file" size={18} /></span>
                  <button
                    className="link-action list-main"
                    style={{ fontSize: 14 }}
                    title={d.descripcion || "Descargar"}
                    onClick={() => handleDescargarDocumento(d.id, d.nombreOriginal)}
                  >
                    {d.nombreOriginal}
                  </button>
                  <span className="list-meta">{formatFechaCorta(d.fechaSubida)}</span>
                  {puedeEliminar && (
                    <button className="btn-danger-ghost" onClick={() => handleEliminarDocumento(d.id)}>
                      Eliminar
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="empty-state">No hay documentos adjuntos todavía.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
