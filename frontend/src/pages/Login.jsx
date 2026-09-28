import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import LoginHero from "../components/LoginHero";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosClient.post("/Auth/login", { email, password });
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      if (!err.response) {
        setError("No se pudo conectar con el servidor. Intentá de nuevo en unos minutos.");
      } else if (err.response.status === 401) {
        setError("Email o contraseña incorrectos");
      } else {
        setError("Ocurrió un error inesperado.");
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

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@estudio.com"
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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