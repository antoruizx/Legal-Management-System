import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { registerTenant, enviarCodigoRegistro } from "../api/tenantsApi";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import PasswordInput, { AvisoCoincidencia } from "../components/PasswordInput";

export default function RegistroEstudio() {
  // El link que mandan los vendedores trae el código: /registro?codigo=FOJA-XXXXXX
  const [searchParams] = useSearchParams();
  const codigoDelLink = searchParams.get("codigo") || "";

  const [form, setForm] = useState({
    studioName: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    invitationCode: codigoDelLink,
  });
  const [confirmar, setConfirmar] = useState("");
  const [paso, setPaso] = useState("datos"); // "datos" → "codigo" (verificación por mail)
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // Con una sesión abierta en este navegador (típico: el vendedor probando su propio link)
  // se avisa en vez de mandar al panel, y se ofrece cerrarla para registrar el estudio.
  if (user) {
    return (
      <AuthLayout>
        <h2>Ya tenés una sesión abierta</h2>
        <p className="login-subtitle">
          Estás conectado como {user.firstName} {user.lastName} ({user.tenantName}). Este link es para que un
          cliente registre su estudio nuevo.
        </p>
        <button type="button" className="btn btn-primary login-submit" onClick={logout}>
          Cerrar sesión y registrar un estudio
        </button>
        <Link to="/dashboard" className="login-link">
          Volver a mi cuenta
        </Link>
      </AuthLayout>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const datosLimpios = () => ({
    ...form,
    studioName: form.studioName.trim(),
    adminFirstName: form.adminFirstName.trim(),
    adminLastName: form.adminLastName.trim(),
    adminEmail: form.adminEmail.trim(),
    invitationCode: form.invitationCode.trim(),
  });

  const mostrarError = (err) => {
    if (err.code === "ECONNABORTED") {
      setError("El servidor tardó demasiado en responder. Probá de nuevo en un momento.");
    } else if (!err.response) {
      setError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
    } else if (err.response.status === 429) {
      setError("Demasiados intentos. Esperá un minuto y volvé a probar.");
    } else if ([400, 403, 503].includes(err.response.status) && err.response.data?.message) {
      setError(err.response.data.message);
    } else {
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
    }
  };

  // Paso 1: valida los datos y manda el código de verificación al email
  const enviarCodigo = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const response = await enviarCodigoRegistro(datosLimpios());
      setInfo(response.data.message);
      setPaso("codigo");
    } catch (err) {
      mostrarError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.adminPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (form.adminPassword !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    enviarCodigo();
  };

  // Paso 2: con el código del mail se crea el estudio y se entra directo
  const handleCrear = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await registerTenant({ ...datosLimpios(), codigoVerificacion: codigoVerificacion.trim() });
      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      mostrarError(err);
    } finally {
      setLoading(false);
    }
  };

  if (paso === "codigo") {
    return (
      <AuthLayout>
        <h2>Revisá tu correo</h2>
        <p className="login-subtitle">
          Te mandamos un código de 6 dígitos a <b>{form.adminEmail.trim()}</b>. Si no lo ves, fijate en la carpeta de spam.
        </p>

        {error && <div className="login-error">{error}</div>}
        {info && !error && <div className="login-info">{info}</div>}

        <form onSubmit={handleCrear}>
          <div className="form-field">
            <label htmlFor="registro-verificacion">Código de verificación</label>
            <input
              id="registro-verificacion"
              className="code-input"
              value={codigoVerificacion}
              onChange={(e) => setCodigoVerificacion(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading || codigoVerificacion.length !== 6}>
            {loading ? "Creando estudio..." : "Crear estudio"}
          </button>

          <button type="button" className="login-link" onClick={enviarCodigo} disabled={loading}>
            Reenviar el código
          </button>
          <button type="button" className="login-link" onClick={() => { setPaso("datos"); setError(""); setCodigoVerificacion(""); }}>
            ← Corregir mis datos
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
          <h2>Registrá tu estudio</h2>
          <p className="login-subtitle">Creá la cuenta del estudio y su usuario administrador. Tenés 7 días de prueba gratis.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="registro-codigo">Código de invitación</label>
              <input
                id="registro-codigo"
                name="invitationCode"
                value={form.invitationCode}
                onChange={handleChange}
                placeholder="FOJA-XXXXXX, el que te pasó tu asesor"
                autoComplete="off"
                required
                autoFocus={!codigoDelLink}
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
                autoFocus={Boolean(codigoDelLink)}
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
              <PasswordInput
                id="registro-password"
                name="adminPassword"
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
              <PasswordInput
                id="registro-confirmar"
                name="confirmar"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                required
              />
              <AvisoCoincidencia password={form.adminPassword} confirmar={confirmar} />
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? "Enviando código..." : "Continuar"}
            </button>

            <Link to="/login" className="login-link">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
          </form>
    </AuthLayout>
  );
}
