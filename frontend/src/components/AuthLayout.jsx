import Logo from "./Logo";

// Marco de las pantallas públicas (login, recuperar contraseña, registro de estudio)
export default function AuthLayout({ children }) {
  return (
    <div className="login-screen">
      <Logo grande />
      <div className="login-card">{children}</div>
      <p className="login-footer">© {new Date().getFullYear()} Foja · Gestión jurídica</p>
    </div>
  );
}
