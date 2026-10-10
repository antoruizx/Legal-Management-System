import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { registerTenant } from "../api/tenantsApi";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import LoginHero from "./LoginHero";

export default function RegistroEstudio() {
  const [form, setForm] = useState({
    studioName: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    invitationCode: "",
  });
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Si ya hay sesión iniciada no tiene sentido registrar otro estudio desde acá
  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.adminPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (form.adminPassword !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const response = await registerTenant({
        ...form,
        studioName: form.studioName.trim(),
        adminFirstName: form.adminFirstName.trim(),
        adminLastName: form.adminLastName.trim(),
        adminEmail: form.adminEmail.trim(),
        invitationCode: form.invitationCode.trim(),
      });
      // El alta devuelve la misma sesión que el login: entramos directo
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError("El servidor tardó demasiado en responder. Probá de nuevo en un momento.");
      } else if (!err.response) {
        setError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      } else if (err.response.status === 429) {
        setError("Demasiados intentos. Esperá un minuto y volvé a probar.");
      } else if ([400, 403].includes(err.response.status) && err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Ocurrió un error inesperado. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-card">
          <div className="login-logo">
            <Logo />
          </div>

          <h2>Registrá tu estudio</h2>
          <p className="login-subtitle">Creá la cuenta del estudio y su usuario administrador.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="registro-codigo">Código de invitación</label>
              <input
                id="registro-codigo"
                name="invitationCode"
                value={form.invitationCode}
                onChange={handleChange}
                placeholder="El que te pasamos para dar de alta el estudio"
                autoComplete="off"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="registro-estudio">Nombre del estudio</label>
              <input
                id="registro-estudio"
                name="studioName"
                value={form.studioName}
                onChange={handleChange}
                placeholder="Estudio Jurídico Pérez"
                maxLength={150}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="registro-nombre">Tu nombre</label>
              <input
                id="registro-nombre"
                name="adminFirstName"
                value={form.adminFirstName}
                onChange={handleChange}
                autoComplete="given-name"
                maxLength={100}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="registro-apellido">Tu apellido</label>
              <input
                id="registro-apellido"
                name="adminLastName"
                value={form.adminLastName}
                onChange={handleChange}
                autoComplete="family-name"
                maxLength={100}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="registro-email">Email</label>
              <input
                id="registro-email"
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={handleChange}
                placeholder="tu@estudio.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="registro-password">Contraseña</label>
              <input
                id="registro-password"
                name="adminPassword"
                type="password"
                value={form.adminPassword}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="registro-confirmar">Repetí la contraseña</label>
              <input
                id="registro-confirmar"
                name="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? "Creando estudio..." : "Crear estudio"}
            </button>

            <Link to="/login" className="login-link">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
          </form>
        </div>
      </div>

      <LoginHero />
    </div>
  );
}
