import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Logo from "../components/Logo";
import LoginHero from "../components/LoginHero";

const CANALES = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
];

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cuenta regresiva para poder reenviar el código
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const mensajeError = (err, porDefecto) =>
    err.response?.data?.message ||
    (!err.response ? "No se pudo conectar con el servidor." : porDefecto);

  const enviarCodigo = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/Auth/forgot-password", { email, channel });
      setInfo(res.data.message);
      setStep(2);
      setCooldown(60);
    } catch (err) {
      setError(mensajeError(err, "No se pudo enviar el código."));
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axiosClient.post("/Auth/verify-reset-code", { email, code });
      setInfo("");
      setStep(3);
    } catch (err) {
      setError(mensajeError(err, "Código incorrecto o vencido."));
    } finally {
      setLoading(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post("/Auth/reset-password", { email, code, newPassword });
      setStep(4);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cambiar la contraseña."));
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

          {error && <div className="login-error">{error}</div>}
          {info && <div className="login-info">{info}</div>}

          {step === 1 && (
            <>
              <h2>Recuperar contraseña</h2>
              <p className="login-subtitle">
                Ingresá tu email y elegí cómo querés recibir el código.
              </p>
              <form onSubmit={enviarCodigo}>
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

                <div className="channel-row">
                  {CANALES.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={`filter-chip ${channel === c.id ? "active" : ""}`}
                      onClick={() => setChannel(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Ingresá el código</h2>
              <p className="login-subtitle">
                Escribí el código de 6 dígitos que te enviamos. Vence en 10 minutos.
              </p>
              <form onSubmit={verificarCodigo}>
                <div className="form-field">
                  <input
                    className="code-input"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="······"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? "Verificando..." : "Verificar código"}
                </button>
              </form>

              <button
                type="button"
                className="login-link"
                onClick={enviarCodigo}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Nueva contraseña</h2>
              <p className="login-subtitle">Elegí una contraseña de al menos 8 caracteres.</p>
              <form onSubmit={cambiarPassword}>
                <div className="form-field">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-field">
                  <label>Repetí la contraseña</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                  {loading ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <>
              <h2>¡Listo!</h2>
              <p className="login-subtitle">
                Tu contraseña fue actualizada. Ya podés iniciar sesión.
              </p>
              <Link to="/" className="btn btn-primary login-submit" style={{ display: "block", textAlign: "center" }}>
                Ir al login
              </Link>
            </>
          )}

          {step !== 4 && (
            <Link to="/" className="login-link">
              ← Volver al inicio de sesión
            </Link>
          )}
        </div>
      </div>

      <LoginHero />
    </div>
  );
}