import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUser, updateUser } from "../api/usersApi";
import BackButton from "../components/BackButton";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

function generarSemillas(cantidad = 10) {
  return Array.from({ length: cantidad }, () => Math.random().toString(36).slice(2, 10));
}

function avatarUrlDeSemilla(semilla) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${semilla}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export default function MiPerfil() {
  const { user, login } = useAuth();

  const [usuarioCompleto, setUsuarioCompleto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", telefono: "" });
  const [avatarActual, setAvatarActual] = useState(null);
  const [semillas, setSemillas] = useState(() => generarSemillas());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    getUser(user.id)
      .then((res) => {
        setUsuarioCompleto(res.data);
        setForm({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          telefono: res.data.telefono || "",
        });
        setAvatarActual(res.data.avatarUrl || null);
      })
      .catch(() => setError("No se pudo cargar tu perfil."))
      .finally(() => setCargando(false));
  }, [user?.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRefrescarAvatares = () => setSemillas(generarSemillas());

  const handleSubirFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarActual(reader.result);
    reader.readAsDataURL(file);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!usuarioCompleto) return;

    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const payload = {
        ...usuarioCompleto,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        telefono: form.telefono,
        avatarUrl: avatarActual,
      };
      await updateUser(usuarioCompleto.id, payload);

      // Guardamos en el contexto/localStorage sin la contraseña, por seguridad
      const { password, ...userSinPassword } = payload;
      login(userSinPassword);
      setUsuarioCompleto(payload);
      setMensaje("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error al guardar perfil:", err.response?.data || err);
      setError("No se pudo guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p>Cargando perfil...</p>;
  if (error && !usuarioCompleto) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <BackButton to="/dashboard" />

      <div className="page-header">
        <h2>Mi perfil</h2>
      </div>

      {error && <div className="login-error">{error}</div>}
      {mensaje && (
        <div className="login-error" style={{ background: "var(--success-bg, #16532033)", color: "var(--success, #22c55e)" }}>
          {mensaje}
        </div>
      )}

      <div className="card form-card">
        <h3>Foto de perfil</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          {avatarActual ? (
            <img
              src={avatarActual}
              alt=""
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-subtle)" }}
            />
          ) : (
            <div className="client-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
              {iniciales(form.firstName, form.lastName)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="btn" style={{ cursor: "pointer", display: "inline-block" }}>
              Subir mi foto
              <input type="file" accept="image/*" onChange={handleSubirFoto} style={{ display: "none" }} />
            </label>
            {avatarActual && (
              <button type="button" className="btn-danger-ghost" onClick={() => setAvatarActual(null)}>
                Quitar foto
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-lo)" }}>O elegí un avatar:</span>
          <button type="button" className="btn" onClick={handleRefrescarAvatares}>
            🔄 Ver otros
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            onClick={() => setAvatarActual(null)}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: avatarActual === null ? "2px solid var(--primary, #6366f1)" : "1px solid var(--border-subtle)",
              padding: 0,
              cursor: "pointer",
              background: "transparent",
            }}
            title="Sin foto (usar iniciales)"
          >
            <div className="client-avatar" style={{ width: "100%", height: "100%", fontSize: 16 }}>
              {iniciales(form.firstName, form.lastName)}
            </div>
          </button>

          {semillas.map((semilla) => {
            const url = avatarUrlDeSemilla(semilla);
            const seleccionado = avatarActual === url;
            return (
              <button
                key={semilla}
                type="button"
                onClick={() => setAvatarActual(url)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: seleccionado ? "2px solid var(--primary, #6366f1)" : "1px solid var(--border-subtle)",
                  padding: 0,
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "var(--bg-elevated)",
                }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%" }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="card form-card">
        <h3>Datos personales</h3>
        <form onSubmit={handleGuardar}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="form-field" style={{ flex: 1, minWidth: 0 }}>
              <label>Nombre</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-field" style={{ flex: 1, minWidth: 0 }}>
              <label>Apellido</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-field">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 381 4123456" />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}