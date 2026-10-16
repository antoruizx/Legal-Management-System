import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUser, updateUser } from "../api/usersApi";
import { changePassword, testEmail } from "../api/authApi";
import BackButton from "../components/BackButton";
import PasswordInput, { AvisoCoincidencia } from "../components/PasswordInput";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

// Avatares 3D: Fluent Emoji de Microsoft (licencia MIT), servidos por jsDelivr.
const AVATAR_BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";
const AVATAR_PERSONAJES = [
  "Man judge", "Woman judge", "Man office worker", "Woman office worker",
  "Man technologist", "Woman technologist", "Man teacher", "Woman teacher",
  "Man student", "Woman student", "Person", "Man", "Woman",
  "Man beard", "Man bald", "Woman red hair", "Woman blonde hair",
  "Woman curly hair", "Person curly hair", "Person white hair",
];
const AVATAR_TONOS = ["Default", "Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];

// Cada "semilla" es un personaje con un tono de piel al azar, sin repetir personaje
function generarSemillas(cantidad = 10) {
  const mezclados = [...AVATAR_PERSONAJES].sort(() => Math.random() - 0.5);
  return mezclados.slice(0, cantidad).map((personaje) => {
    const tono = AVATAR_TONOS[Math.floor(Math.random() * AVATAR_TONOS.length)];
    return `${personaje}|${tono}`;
  });
}

function avatarUrlDeSemilla(semilla) {
  const [personaje, tono] = semilla.split("|");
  const archivo = `${personaje.toLowerCase().replaceAll(" ", "_")}_3d_${tono.toLowerCase()}.png`;
  return `${AVATAR_BASE}/${encodeURIComponent(personaje)}/${tono}/3D/${archivo}`;
}

export default function MiPerfil() {
  const { user, actualizarUsuario } = useAuth();

  const [usuarioCompleto, setUsuarioCompleto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", telefono: "" });
  const [avatarActual, setAvatarActual] = useState(null);
  const [semillas, setSemillas] = useState(() => generarSemillas());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Diagnóstico de mail (solo Admin)
  const [probandoMail, setProbandoMail] = useState(false);
  const [resultadoMail, setResultadoMail] = useState(null);

  // Cambio de contraseña
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirmar, setPassConfirmar] = useState("");
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [errorPass, setErrorPass] = useState("");
  const [mensajePass, setMensajePass] = useState("");

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

      // Actualizamos la sesión conservando el token (antes se pisaba con el perfil sin token
      // y la persona quedaba deslogueada en el siguiente pedido).
      actualizarUsuario({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        telefono: form.telefono,
        avatarUrl: avatarActual,
      });
      setUsuarioCompleto(payload);
      setMensaje("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error al guardar perfil:", err.response?.data || err);
      setError(err.response?.data?.message || "No se pudo guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  const handleProbarMail = async () => {
    setProbandoMail(true);
    setResultadoMail(null);
    try {
      const res = await testEmail();
      setResultadoMail(res.data);
    } catch (err) {
      setResultadoMail({
        ok: false,
        detalle: err.response?.data?.message || "No se pudo llamar al servidor.",
      });
    } finally {
      setProbandoMail(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPass("");
    setMensajePass("");

    if (passNueva.length < 8) {
      setErrorPass("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (passNueva !== passConfirmar) {
      setErrorPass("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (passNueva === passActual) {
      setErrorPass("La contraseña nueva debe ser distinta de la actual.");
      return;
    }

    setCambiandoPass(true);
    try {
      const res = await changePassword(passActual, passNueva);
      setMensajePass(res.data?.message || "Contraseña actualizada correctamente.");
      setPassActual("");
      setPassNueva("");
      setPassConfirmar("");
    } catch (err) {
      if (err.response?.status === 429) {
        setErrorPass("Demasiados intentos. Esperá un minuto y volvé a probar.");
      } else if (err.code === "ECONNABORTED" || !err.response) {
        setErrorPass("No se pudo conectar con el servidor. Intentá de nuevo.");
      } else {
        setErrorPass(err.response.data?.message || "No se pudo cambiar la contraseña.");
      }
    } finally {
      setCambiandoPass(false);
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
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", background: "var(--color-primary-light)", border: "2px solid var(--border-subtle)" }}
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
              border: avatarActual === null ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
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
                  border: seleccionado ? "2px solid var(--accent)" : "1px solid var(--border-subtle)",
                  padding: 0,
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "var(--color-primary-light)",
                }}
              >
                <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: +54 381 4123456" />
            <span className="field-hint">
              Guardalo con el código de país (+54...). Se usa para recuperar la contraseña por SMS o WhatsApp.
            </span>
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

      <div className="card form-card">
        <h3>Cambiar contraseña</h3>

        {errorPass && <div className="login-error">{errorPass}</div>}
        {mensajePass && <div className="login-info">{mensajePass}</div>}

        <form onSubmit={handleCambiarPassword}>
          {/* Campo de usuario oculto: ayuda al navegador a actualizar la contraseña guardada correcta */}
          <input
            type="email"
            name="username"
            autoComplete="username"
            value={form.email}
            readOnly
            hidden
          />

          <div className="form-field">
            <label htmlFor="pass-actual">Contraseña actual</label>
            <PasswordInput
              id="pass-actual"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="pass-nueva">Contraseña nueva</label>
            <PasswordInput
              id="pass-nueva"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="pass-confirmar">Repetí la contraseña nueva</label>
            <PasswordInput
              id="pass-confirmar"
              value={passConfirmar}
              onChange={(e) => setPassConfirmar(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <AvisoCoincidencia password={passNueva} confirmar={passConfirmar} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={cambiandoPass}>
            {cambiandoPass ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>

      {user?.role === "Admin" && (
        <div className="card form-card">
          <h3>Probar envío de mail</h3>
          <p style={{ color: "var(--text-lo)", fontSize: 13, marginBottom: 12 }}>
            Envía un mail de prueba a {user.email} y muestra qué respondió el servicio de correo.
            Sirve para saber por qué no llegan los códigos de recuperación.
          </p>

          <button type="button" className="btn" onClick={handleProbarMail} disabled={probandoMail}>
            {probandoMail ? "Enviando..." : "Enviar mail de prueba"}
          </button>

          {resultadoMail && (
            <div
              className={resultadoMail.ok ? "login-info" : "login-error"}
              style={{ marginTop: 12, wordBreak: "break-word" }}
            >
              {resultadoMail.ok
                ? `Brevo aceptó el mail para ${resultadoMail.enviadoA}. Si no lo ves en unos minutos, revisá Spam y Promociones.`
                : `No se pudo enviar: ${resultadoMail.detalle}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
