import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

// Lee la fecha de vencimiento (exp) del JWT sin librerías
function tokenVigente(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return !exp || exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Recupera la sesión guardada. Si está corrupta, sin token o vencida, la descarta
// (antes un valor roto en localStorage dejaba la app en blanco).
function leerSesionGuardada() {
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const user = JSON.parse(saved);
    if (user?.token && tokenVigente(user.token)) return user;
  } catch {
    // ignoramos y limpiamos abajo
  }
  localStorage.removeItem("user");
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerSesionGuardada);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Actualiza datos del usuario (ej. al editar el perfil) CONSERVANDO el token.
  const actualizarUsuario = (datos) => {
    setUser((prev) => {
      if (!prev) return prev;
      const siguiente = { ...prev, ...datos, token: prev.token };
      localStorage.setItem("user", JSON.stringify(siguiente));
      return siguiente;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
