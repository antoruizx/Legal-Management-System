import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUsers, updateUser, createUser } from "../api/usersApi";
import { cargarDatosDemo, quitarDatosDemo } from "../api/demoApi";
import PasswordInput, { AvisoCoincidencia } from "../components/PasswordInput";
import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { iniciales } from "../utils/tareas";

const ROLES_ASIGNABLES = ["Abogado", "Asistente"];

const MODULOS_PERMISOS = [
  { label: "Clientes", editar: "puedeEditarClientes", eliminar: "puedeEliminarClientes" },
  { label: "Expedientes", editar: "puedeEditarExpedientes", eliminar: "puedeEliminarExpedientes" },
  { label: "Tareas", editar: "puedeEditarTareas", eliminar: "puedeEliminarTareas" },
];

export default function ConfiguracionUsuarios() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({ firstName: "", lastName: "", email: "", password: "", role: ROLES_ASIGNABLES[0] });
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const [procesandoDemo, setProcesandoDemo] = useState(false);
  const [errorDemo, setErrorDemo] = useState("");
  // Los usuarios de ejemplo se reconocen por el dominio de su email (ver DemoController)
  const hayDatosDemo = users.some((u) => u.email.endsWith("@ejemplo.foja"));

  const cargarUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "Admin") {
      cargarUsers();
    }
  }, [user]);

  if (user?.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleTogglePermiso = async (u, campo) => {
    setGuardandoId(u.id);
    try {
      const payload = { ...u, [campo]: !u[campo] };
      await updateUser(u.id, payload);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? payload : x)));
    } catch (err) {
      alert("No se pudo actualizar el permiso");
    } finally {
      setGuardandoId(null);
    }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorForm("");
    if (nuevo.password !== confirmarPassword) {
      setErrorForm("Las contraseñas no coinciden");
      return;
    }
    setCreando(true);
    try {
      await createUser({
        ...nuevo,
        puedeEditarClientes: false,
        puedeEliminarClientes: false,
        puedeEditarExpedientes: false,
        puedeEliminarExpedientes: false,
        puedeEditarTareas: false,
        puedeEliminarTareas: false,
      });
      setNuevo({ firstName: "", lastName: "", email: "", password: "", role: ROLES_ASIGNABLES[0] });
      setConfirmarPassword("");
      setMostrarForm(false);
      cargarUsers();
    } catch (err) {
      setErrorForm(err.response?.data?.message || "No se pudo crear el usuario. Revisá los datos.");
    } finally {
      setCreando(false);
    }
  };

  const handleDatosDemo = async () => {
    if (hayDatosDemo && !confirm("¿Quitar los datos de ejemplo? Se borran sus clientes, expedientes, tareas y usuarios.")) return;
    setProcesandoDemo(true);
    setErrorDemo("");
    try {
      await (hayDatosDemo ? quitarDatosDemo() : cargarDatosDemo());
      // Recarga completa: el panel, la campanita y el buscador ya tienen datos viejos en memoria
      window.location.reload();
    } catch (err) {
      setErrorDemo(err.response?.data?.message || "No se pudo completar la operación.");
      setProcesandoDemo(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div className="dashboard">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-title">Usuarios y permisos</h2>
          <p className="page-subtitle" style={{ color: "var(--text-lo)" }}>
            Definí, módulo por módulo, quién puede editar y quién puede eliminar.
          </p>
        </div>
        {!mostrarForm && (
          <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
            + Agregar usuario
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="card">
          <form onSubmit={handleCrearUsuario} style={{ maxWidth: 520 }}>
            {errorForm && <div className="login-error">{errorForm}</div>}
            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-field" style={{ flex: 1, minWidth: 0 }}>
                <label>Nombre</label>
                <input
                  value={nuevo.firstName}
                  onChange={(e) => setNuevo({ ...nuevo, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-field" style={{ flex: 1, minWidth: 0 }}>
                <label>Apellido</label>
                <input
                  value={nuevo.lastName}
                  onChange={(e) => setNuevo({ ...nuevo, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Contraseña</label>
              <PasswordInput
                value={nuevo.password}
                onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="form-field">
              <label>Repetí la contraseña</label>
              <PasswordInput
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <AvisoCoincidencia password={nuevo.password} confirmar={confirmarPassword} />
            </div>
            <div className="form-field">
              <label>Rol</label>
              <select value={nuevo.role} onChange={(e) => setNuevo({ ...nuevo, role: e.target.value })}>
                {ROLES_ASIGNABLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={creando}>
                {creando ? "Creando..." : "Crear usuario"}
              </button>
              <button type="button" className="btn" onClick={() => setMostrarForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Clientes</th>
              <th>Expedientes</th>
              <th>Tareas</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              // Un administrador siempre puede todo: sus permisos se muestran pero no se editan
              const esAdminFila = u.role === "Admin";
              return (
                <tr key={u.id}>
                  <td data-label="Usuario">
                    <div className="client-list-card">
                      <div className="client-avatar">{iniciales(u.firstName, u.lastName)}</div>
                      <div>
                        <div>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: 13, color: "var(--text-lo)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Rol">
                    <span className="badge badge-info">{esAdminFila ? "Administrador" : u.role}</span>
                  </td>
                  {MODULOS_PERMISOS.map(({ label, editar, eliminar }) => (
                    <td key={editar} data-label={label}>
                      {[["Editar", editar], ["Eliminar", eliminar]].map(([texto, campo]) => (
                        <label key={campo} className="permiso">
                          <input
                            type="checkbox"
                            checked={esAdminFila || !!u[campo]}
                            disabled={esAdminFila || guardandoId === u.id}
                            onChange={() => handleTogglePermiso(u, campo)}
                          />
                          {texto}
                        </label>
                      ))}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card info-cards">
        <div className="info-card">
          <div className="kpi-icon"><Icon name="mail" size={22} /></div>
          <div>
            <h3 className="card-title">Recuperar contraseña</h3>
            <p>Por email, SMS o WhatsApp, con código de verificación.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="kpi-icon"><Icon name="bell" size={22} /></div>
          <div>
            <h3 className="card-title">Notificaciones en el sistema</h3>
            <p>La campanita avisa de tareas vencidas y de las que vencen en los próximos 7 días.</p>
          </div>
        </div>
        <div className="info-card">
          <div className="kpi-icon"><Icon name="key" size={22} /></div>
          <div>
            <h3 className="card-title">Permisos por módulo</h3>
            <p>Cambiar el estado de un expediente o completar una tarea está permitido para todos.</p>
          </div>
        </div>
      </div>

      <div className="card card-head" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="card-title">Datos de ejemplo</h3>
          <p className="card-caption" style={{ fontSize: 13 }}>
            {hayDatosDemo
              ? "El estudio tiene cargados clientes, expedientes, tareas y usuarios de ejemplo. Al quitarlos, tus datos reales no se tocan."
              : "Cargá clientes, expedientes, movimientos, tareas y usuarios de ejemplo para ver el sistema con contenido. Después se pueden quitar."}
          </p>
          {errorDemo && <p style={{ color: "var(--danger)", fontSize: 13, margin: "6px 0 0" }}>{errorDemo}</p>}
        </div>
        <button className="btn" onClick={handleDatosDemo} disabled={procesandoDemo}>
          {procesandoDemo ? "Procesando..." : hayDatosDemo ? "Quitar datos de ejemplo" : "Cargar datos de ejemplo"}
        </button>
      </div>
    </div>
  );
}