import { useEffect, useState } from "react";
import { getUsers, updateUser, createUser } from "../api/usersApi";
import BackButton from "../components/BackButton";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

const ROLES_ASIGNABLES = ["Abogado", "Asistente"];

export default function ConfiguracionUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({ firstName: "", lastName: "", email: "", password: "", role: ROLES_ASIGNABLES[0] });
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const cargarUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      // Solo se administran permisos de usuarios que no son Admin
      setUsers(response.data.filter((u) => u.role !== "Admin"));
    } catch (err) {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsers();
  }, []);

  const handleTogglePermiso = async (u) => {
    setGuardandoId(u.id);
    try {
      const payload = { ...u, puedeEditarExpedientes: !u.puedeEditarExpedientes };
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
    setCreando(true);
    setErrorForm("");
    try {
      await createUser({ ...nuevo, puedeEditarExpedientes: false });
      setNuevo({ firstName: "", lastName: "", email: "", password: "", role: ROLES_ASIGNABLES[0] });
      setMostrarForm(false);
      cargarUsers();
    } catch (err) {
      setErrorForm("No se pudo crear el usuario. Revisá los datos.");
    } finally {
      setCreando(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <div className="page-header">
        <BackButton />
        <h2>Configuración de usuarios</h2>
      </div>

      <p style={{ color: "var(--text-lo)", fontSize: 13, marginBottom: 16 }}>
        Por el momento hay un solo administrador. Desde acá podés definir qué usuarios pueden editar o
        eliminar expedientes; el resto solo tiene acceso de lectura.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        {!mostrarForm ? (
          <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
            + Agregar usuario
          </button>
        ) : (
          <form onSubmit={handleCrearUsuario}>
            {errorForm && <div className="login-error">{errorForm}</div>}
            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label>Nombre</label>
                <input
                  value={nuevo.firstName}
                  onChange={(e) => setNuevo({ ...nuevo, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
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
              <input
                type="password"
                value={nuevo.password}
                onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
                required
              />
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
        )}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Puede editar/eliminar expedientes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Usuario">
                  <div className="client-list-card">
                    <div className="client-avatar">{iniciales(u.firstName, u.lastName)}</div>
                    <span>{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Rol">
                  <span className="badge badge-info">{u.role}</span>
                </td>
                <td data-label="Permiso">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!u.puedeEditarExpedientes}
                      disabled={guardandoId === u.id}
                      onChange={() => handleTogglePermiso(u)}
                    />
                    {u.puedeEditarExpedientes ? "Lectura y escritura" : "Solo lectura"}
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <p className="empty-state">No hay usuarios para administrar todavía.</p>}
      </div>
    </div>
  );
}