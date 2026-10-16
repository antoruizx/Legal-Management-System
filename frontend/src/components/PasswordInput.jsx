import { useState } from "react";
import Icon from "./Icon";

// Campo de contraseña con el botón del ojito para mostrarla u ocultarla.
// Recibe las mismas props que un <input> (id, value, onChange, className, autoComplete...).
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}

// Aviso en vivo debajo de "Repetí la contraseña": se muestra apenas el usuario empieza a escribir
export function AvisoCoincidencia({ password, confirmar }) {
  if (!confirmar) return null;
  const coinciden = password === confirmar;
  return (
    <small className={`password-match ${coinciden ? "ok" : "error"}`}>
      {coinciden ? "✓ Las contraseñas coinciden" : "Las contraseñas no coinciden"}
    </small>
  );
}
