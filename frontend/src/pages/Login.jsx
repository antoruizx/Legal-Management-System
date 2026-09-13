import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

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
      setError("Email o contraseña incorrectos");
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
          </form>
        </div>
      </div>

      <div className="login-hero">
        <div className="login-hero-content">
          <h1>Gestioná tu estudio jurídico en un solo lugar</h1>
          <p>
            Clientes, expedientes y tareas organizados, con vencimientos y estados
            siempre a la vista.
          </p>
          <div className="login-hero-badges">
            <span className="badge badge-success"><span className="badge-dot dot-success"></span>Activo</span>
            <span className="badge badge-info"><span className="badge-dot dot-info"></span>En trámite</span>
            <span className="badge badge-warning"><span className="badge-dot dot-warning"></span>Próxima</span>
            <span className="badge badge-danger"><span className="badge-dot dot-danger"></span>Urgente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
