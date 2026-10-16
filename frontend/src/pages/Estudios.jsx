import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getTenants,
  setTenantActive,
  extenderPrueba,
  activarPago,
  getVendedores,
  crearVendedor,
} from "../api/tenantsApi";
import ConfirmDialog from "../components/ConfirmDialog";
import PasswordInput, { AvisoCoincidencia } from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { estadoComercial } from "../utils/prueba";

const VENDEDOR_VACIO = { firstName: "", lastName: "", email: "", telefono: "", password: "" };

function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR");
}

// Panel del superadmin: todos los estudios de la app (activar/desactivar, extender la prueba,
// pasar a pago) y los vendedores que generan códigos de prueba.
export default function Estudios() {
  const { user } = useAuth();

  const [estudios, setEstudios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);
  const [aDesactivar, setADesactivar] = useState(null);

  const [mostrarFormVendedor, setMostrarFormVendedor] = useState(false);
  const [nuevoVendedor, setNuevoVendedor] = useState(VENDEDOR_VACIO);
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [creandoVendedor, setCreandoVendedor] = useState(false);
  const [errorVendedor, setErrorVendedor] = useState("");

  const cargar = () =>
    Promise.all([getTenants(), getVendedores()])
      .then(([estudiosRes, vendedoresRes]) => {
        setEstudios(estudiosRes.data);
        setVendedores(vendedoresRes.data);
      })
      .catch(() => setError("No se pudieron cargar los estudios"))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (user?.esSuperAdmin) cargar();
  }, [user]);

  if (!user?.esSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const ejecutar = async (estudio, accion, mensajeError) => {
    setGuardandoId(estudio.id);
    try {
      await accion();
      await cargar();
    } catch (err) {
      alert(err.response?.data?.message || mensajeError);
    } finally {
      setGuardandoId(null);
    }
  };

  const confirmarDesactivar = () => {
    const estudio = aDesactivar;
    setADesactivar(null);
    ejecutar(estudio, () => setTenantActive(estudio.id, false), "No se pudo desactivar el estudio");
  };

  const handleCrearVendedor = async (e) => {
    e.preventDefault();
    setErrorVendedor("");
    if (nuevoVendedor.password !== confirmarPassword) {
      setErrorVendedor("Las contraseñas no coinciden");
      return;
    }
    setCreandoVendedor(true);
    try {
      await crearVendedor({
        firstName: nuevoVendedor.firstName.trim(),
        lastName: nuevoVendedor.lastName.trim(),
        email: nuevoVendedor.email.trim(),
        telefono: nuevoVendedor.telefono.trim(),
        password: nuevoVendedor.password,
      });
      setNuevoVendedor(VENDEDOR_VACIO);
      setConfirmarPassword("");
      setMostrarFormVendedor(false);
      await cargar();
    } catch (err) {
      setErrorVendedor(err.response?.data?.message || "No se pudo crear el vendedor");
    } finally {
      setCreandoVendedor(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  const clientes = estudios.filter((e) => !e.esDeVendedor);

  return (
    <div className="dashboard">
      <div>
        <h2 className="page-title">Estudios</h2>
        <p className="page-subtitle" style={{ color: "var(--text-lo)" }}>
          Los estudios en prueba no pueden entrar cuando se les vence; los desactivados, nunca. En ambos casos
          sus datos se conservan, y quien ya tenía la sesión abierta sigue hasta que se le vence (8 horas).
        </p>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Estudio</th>
              <th>Administrador</th>
              <th>Vendedor</th>
              <th>Alta</th>
              <th>Plan</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((e) => {
              const esElPropio = e.id === user.tenantId;
              const plan = estadoComercial(e);
              const ocupado = guardandoId === e.id;
              return (
                <tr key={e.id}>
                  <td data-label="Estudio">
                    <div className="client-list-card">
                      <div className="client-avatar">{iniciales(e.name)}</div>
                      <div>
                        <div>{e.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-lo)" }}>{e.usuarios} usuarios</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Administrador">{e.adminEmail || "—"}</td>
                  <td data-label="Vendedor">{e.vendedor || "—"}</td>
                  <td data-label="Alta">{formatearFecha(e.createdAt)}</td>
                  <td data-label="Plan">
                    {e.active ? (
                      <span className={`badge ${plan.clase}`}>{plan.label}</span>
                    ) : (
                      <span className="badge badge-danger">Desactivado</span>
                    )}
                  </td>
                  <td data-label="Acciones">
                    {esElPropio ? (
                      <span style={{ fontSize: 12, color: "var(--text-lo)" }}>Tu estudio</span>
                    ) : (
                      <>
                        {e.pruebaHasta && (
                          <>
                            <button
                              className="link-strong link-action"
                              disabled={ocupado}
                              onClick={() => ejecutar(e, () => extenderPrueba(e.id, 7), "No se pudo extender la prueba")}
                            >
                              +7 días
                            </button>
                            {" · "}
                            <button
                              className="link-strong link-action"
                              disabled={ocupado}
                              onClick={() => ejecutar(e, () => activarPago(e.id), "No se pudo activar el estudio")}
                            >
                              Pasar a pago
                            </button>
                            {" · "}
                          </>
                        )}
                        {e.active ? (
                          <button className="btn-danger-ghost" disabled={ocupado} onClick={() => setADesactivar(e)}>
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="link-strong link-action"
                            disabled={ocupado}
                            onClick={() => ejecutar(e, () => setTenantActive(e.id, true), "No se pudo activar el estudio")}
                          >
                            Activar
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {clientes.length === 0 && <p className="empty-state">No hay estudios registrados todavía.</p>}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Vendedores</h3>
            <p className="card-caption" style={{ fontSize: 13 }}>
              Generan códigos de prueba desde su cuenta. Cada uno tiene un estudio de demostración propio, vacío,
              para mostrar el sistema sin ver datos de clientes. Su WhatsApp aparece en los mails y en la pantalla
              de prueba vencida de los estudios que traen. Lo pueden cambiar desde Mi perfil.
            </p>
          </div>
          {!mostrarFormVendedor && (
            <button className="btn btn-primary" onClick={() => setMostrarFormVendedor(true)}>+ Agregar vendedor</button>
          )}
        </div>

        {mostrarFormVendedor && (
          <form onSubmit={handleCrearVendedor} style={{ marginBottom: 16 }}>
            {errorVendedor && <div className="login-error">{errorVendedor}</div>}
            <div className="inline-form">
              <input className="input" placeholder="Nombre" value={nuevoVendedor.firstName} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, firstName: e.target.value })} required />
              <input className="input" placeholder="Apellido" value={nuevoVendedor.lastName} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, lastName: e.target.value })} required />
              <input className="input" type="email" placeholder="Email" value={nuevoVendedor.email} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, email: e.target.value })} required />
              <input className="input" type="tel" placeholder="WhatsApp: +54 9 381 1234567" title="Con código de país: lo usan los botones de WhatsApp de los mails a sus clientes" value={nuevoVendedor.telefono} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, telefono: e.target.value })} required />
              <PasswordInput className="input" placeholder="Contraseña (mín. 8)" minLength={8} autoComplete="new-password" value={nuevoVendedor.password} onChange={(e) => setNuevoVendedor({ ...nuevoVendedor, password: e.target.value })} required />
              <PasswordInput className="input" placeholder="Repetí la contraseña" autoComplete="new-password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <AvisoCoincidencia password={nuevoVendedor.password} confirmar={confirmarPassword} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={creandoVendedor}>
                {creandoVendedor ? "Creando..." : "Crear vendedor"}
              </button>
              <button type="button" className="btn" onClick={() => setMostrarFormVendedor(false)}>Cancelar</button>
            </div>
          </form>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Códigos</th>
              <th>En prueba</th>
              <th>Pagos</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v) => (
              <tr key={v.id}>
                <td data-label="Vendedor">{v.firstName} {v.lastName}</td>
                <td data-label="Email">{v.email}</td>
                <td data-label="WhatsApp">{v.telefono || "—"}</td>
                <td data-label="Códigos">{v.codigosGenerados}</td>
                <td data-label="En prueba">{v.estudiosEnPrueba}</td>
                <td data-label="Pagos">{v.estudiosPagos}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {vendedores.length === 0 && <p className="empty-state">Todavía no agregaste vendedores.</p>}
      </div>

      <ConfirmDialog
        abierto={Boolean(aDesactivar)}
        titulo="Desactivar estudio"
        mensaje={`Los usuarios de "${aDesactivar?.name}" no van a poder iniciar sesión hasta que lo vuelvas a activar. Sus datos no se borran.`}
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setADesactivar(null)}
      />
    </div>
  );
}
