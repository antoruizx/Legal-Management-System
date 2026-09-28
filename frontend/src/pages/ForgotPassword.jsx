import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Logo from "../components/Logo";
import LoginHero from "./LoginHero";

const CANALES = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
];

// iso: código del país (para la bandera), dial: prefijo internacional
const PAISES = [
  { iso: "ar", nombre: "Argentina", dial: "+54" },
  { iso: "uy", nombre: "Uruguay", dial: "+598" },
  { iso: "cl", nombre: "Chile", dial: "+56" },
  { iso: "py", nombre: "Paraguay", dial: "+595" },
  { iso: "bo", nombre: "Bolivia", dial: "+591" },
  { iso: "br", nombre: "Brasil", dial: "+55" },
  { iso: "pe", nombre: "Perú", dial: "+51" },
  { iso: "co", nombre: "Colombia", dial: "+57" },
  { iso: "ec", nombre: "Ecuador", dial: "+593" },
  { iso: "ve", nombre: "Venezuela", dial: "+58" },
  { iso: "mx", nombre: "México", dial: "+52" },
  { iso: "us", nombre: "Estados Unidos", dial: "+1" },
  { iso: "es", nombre: "España", dial: "+34" },
  { iso: "it", nombre: "Italia", dial: "+39" },
  { iso: "de", nombre: "Alemania", dial: "+49" },
  { iso: "fr", nombre: "Francia", dial: "+33" },
  { iso: "gb", nombre: "Reino Unido", dial: "+44" },
];

// Las banderas son imágenes (los emojis de bandera no se ven en Windows)
function Bandera({ iso }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${iso}.png`}
      srcSet={`https://flagcdn.com/w40/${iso}.png 2x`}
      width="20"
      height="15"
      alt=""
      style={{ borderRadius: 2, objectFit: "cover" }}
    />
  );
}

// Deja solo los dígitos y saca los ceros iniciales (0381 -> 381)
const soloDigitos = (v) => v.replace(/\D/g, "").replace(/^0+/, "");

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState("email");
  const [email, setEmail] = useState("");
  const [pais, setPais] = useState(PAISES[0]);
  const [telefono, setTelefono] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const pickerRef = useRef(null);

  // Cuenta regresiva para poder reenviar el código
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Cierra el selector de país al hacer clic afuera
  useEffect(() => {
    if (!menuAbierto) return;
    const cerrar = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [menuAbierto]);

  const esEmail = channel === "email";
  const digitos = soloDigitos(telefono);
  const telefonoValido = digitos.length >= 6 && digitos.length <= 14;

  // Identifica a la persona: por email, o por teléfono en formato internacional (+54381...)
  const identificador = () =>
    esEmail ? { email: email.trim() } : { phone: `${pais.dial}${digitos}` };

  const mensajeError = (err, porDefecto) => {
    if (err.response?.status === 429) return "Demasiados intentos. Esperá un minuto y volvé a probar.";
    if (err.code === "ECONNABORTED") return "El servidor tardó demasiado en responder. Probá de nuevo.";
    if (!err.response) return "No se pudo conectar con el servidor.";
    return err.response.data?.message || porDefecto;
  };

  const elegirCanal = (id) => {
    setChannel(id);
    setError("");
  };

  const enviarCodigo = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");

    if (!esEmail && !telefonoValido) {
      setError("Ingresá un número de teléfono válido (sin el 0 ni el 15).");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post("/Auth/forgot-password", { ...identificador(), channel });
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
      await axiosClient.post("/Auth/verify-reset-code", { ...identificador(), code });
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
      await axiosClient.post("/Auth/reset-password", { ...identificador(), code, newPassword });
      setStep(4);
    } catch (err) {
      setError(mensajeError(err, "No se pudo cambiar la contraseña."));
    } finally {
      setLoading(false);
    }
  };

  const volverAlPrimerPaso = () => {
    setStep(1);
    setCode("");
    setError("");
    setInfo("");
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
                Elegí cómo querés recibir el código de 6 dígitos.
              </p>

              <div className="channel-row">
                {CANALES.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`filter-chip ${channel === c.id ? "active" : ""}`}
                    onClick={() => elegirCanal(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <form onSubmit={enviarCodigo}>
                {esEmail ? (
                  <div className="form-field">
                    <label htmlFor="fp-email">Email</label>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@estudio.com"
                      autoComplete="username"
                      required
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="form-field">
                    <label htmlFor="fp-phone">Teléfono</label>
                    <div className="phone-row">
                      <div className="country-picker" ref={pickerRef}>
                        <button
                          type="button"
                          className="country-btn"
                          aria-haspopup="listbox"
                          aria-expanded={menuAbierto}
                          onClick={() => setMenuAbierto((v) => !v)}
                        >
                          <Bandera iso={pais.iso} />
                          <span>{pais.dial}</span>
                          <span aria-hidden="true">▾</span>
                        </button>
                        {menuAbierto && (
                          <ul className="country-menu" role="listbox">
                            {PAISES.map((p) => (
                              <li key={p.iso}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={p.iso === pais.iso}
                                  className={`country-option ${p.iso === pais.iso ? "selected" : ""}`}
                                  onClick={() => {
                                    setPais(p);
                                    setMenuAbierto(false);
                                  }}
                                >
                                  <Bandera iso={p.iso} />
                                  <span>{p.nombre}</span>
                                  <span className="dial">{p.dial}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <input
                        id="fp-phone"
                        type="tel"
                        inputMode="numeric"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/[^\d\s-]/g, ""))}
                        placeholder="381 123 4567"
                        autoComplete="tel-national"
                        required
                        autoFocus
                      />
                    </div>
                    <span className="field-hint">
                      Escribilo sin el 0 ni el 15. Debe ser el teléfono guardado en tu perfil.
                    </span>
                  </div>
                )}

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
                    autoComplete="one-time-code"
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
              <button type="button" className="login-link" onClick={volverAlPrimerPaso}>
                Usar otro email o canal
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Nueva contraseña</h2>
              <p className="login-subtitle">Elegí una contraseña de al menos 8 caracteres.</p>
              <form onSubmit={cambiarPassword}>
                <div className="form-field">
                  <label htmlFor="fp-new">Nueva contraseña</label>
                  <input
                    id="fp-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="fp-confirm">Repetí la contraseña</label>
                  <input
                    id="fp-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
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
              <Link
                to="/login"
                className="btn btn-primary login-submit"
                style={{ display: "block", textAlign: "center" }}
              >
                Ir al login
              </Link>
            </>
          )}

          {step !== 4 && (
            <Link to="/login" className="login-link">
              ← Volver al inicio de sesión
            </Link>
          )}
        </div>
      </div>

      <LoginHero />
    </div>
  );
}
