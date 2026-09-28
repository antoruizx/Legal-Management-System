import { useEffect, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import LoginHero from "./LoginHero";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lento, setLento] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // El servidor gratuito de Render se "duerme" y la primera respuesta puede tardar ~1 minuto.
  // Si pasan unos segundos, avisamos para que la persona no piense que se colgó.
  useEffect(() => {
    if (!loading) {
      setLento(false);
      return;
    }
    const t = setTimeout(() => setLento(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  // Si ya hay sesión iniciada no tiene sentido mostrar el login
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosClient.post("/Auth/login", {
        email: email.trim(),
        password,
      });
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError("El servidor tardó demasiado en responder. Probá de nuevo en un momento.");
      } else if (!err.response) {
        setError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      } else if (err.response.status === 401) {
        setError("Email o contraseña incorrectos");
      } else if (err.response.status === 429) {
        setError("Demasiados intentos. Esperá un minuto y volvé a probar.");
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

          <h2>Iniciar sesión</h2>
          <p className="login-subtitle">Ingresá tus credenciales para acceder al estudio.</p>

          {error && <div className="login-error">{error}</div>}
          {loading && lento && (
            <div className="login-info">
              El servidor se está despertando, puede tardar hasta un minuto. No cierres la página.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@estudio.com"
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <Link to="/forgot-password" className="login-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </form>
        </div>
      </div>

      <LoginHero />
    </div>
  );
}
