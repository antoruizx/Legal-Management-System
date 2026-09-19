import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, updateUser, deleteUser } from "../api/usersApi";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

const ROLES = ["Admin", "Abogado", "Asistente"];

export default function UsuarioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "", password: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getUser(id)
      .then((res) => {
        setUsuario(res.data);
        setForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          role: res.data.role,
          password: "",
        });
      })
      .catch(() => setError("No se pudo cargar el usuario"));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const payload = {
        id: Number(id),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        // si dejó la contraseña vacía, mantenemos la actual
        password: form.password ? form.password : usuario.password,
      };
      await updateUser(id, payload);
      setUsuario(payload);
      setEditando(false);
      setForm({ ...form, password: "" });
    } catch (err) {
      setError("No se pudo guardar. Revisá los datos.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (Number(id) === currentUser?.id) {
      alert("No podés eliminar tu propio usuario mientras estás logueado con él.");
      return;
    }
    if (!confirm("¿Eliminar este usuario definitivamente?")) return;
    try {
      await deleteUser(id);
      navigate("/usuarios");
    } catch (err) {
      alert("No se pudo eliminar el usuario");
    }
  };

  if (error && !usuario) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!usuario) return <p>Cargando...</p>;

  return (
    <div>
      <BackButton />

      <div className="detail-header">
        <div className="detail-title-row">
          <div className="client-avatar" style={{ width: 56, height: 56, fontSize: 19 }}>
            {iniciales(usuario.firstName, usuario.lastName)}
          </div>
          <div>
            <h2>{usuario.firstName} {usuario.lastName}</h2>
            <div className="detail-subtitle">
              <span className="badge badge-info">{usuario.role}</span>
              {Number(id) === currentUser?.id && <span style={{ marginLeft: 8 }}>· Este sos vos</span>}
            </div>
          </div>
        </div>

        {!editando && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setEditando(true)}>Editar datos</button>
            <button className="btn-danger-ghost" onClick={handleEliminar}>Eliminar usuario</button>
          </div>
        )}
      </div>

      {error && <div className="login-error">{error}</div>}

      {!editando ? (
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Nombre</div>
            <div className="detail-value">{usuario.firstName}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Apellido</div>
            <div className="detail-value">{usuario.lastName}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Email</div>
            <div className="detail-value">{usuario.email}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Rol</div>
            <div className="detail-value">{usuario.role}</div>
          </div>
        </div>
      ) : (
        <div className="card form-card">
          <form onSubmit={handleGuardar}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label>Nombre</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label>Apellido</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label>Rol</label>
              <select name="role" value={form.role} onChange={handleChange} required>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Nueva contraseña (dejar vacío para no cambiarla)</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" className="btn" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
