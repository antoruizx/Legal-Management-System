import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5160/api",
  headers: {
    "Content-Type": "application/json",
  },
  // El backend en Render (plan gratuito) puede tardar ~1 minuto en "despertar":
  // sin timeout la pantalla quedaba cargando para siempre.
  timeout: 70000,
});

// Agrega el token JWT a cada petición, si existe uno guardado
axiosClient.interceptors.request.use((config) => {
  const userGuardado = localStorage.getItem("user");
  if (userGuardado) {
    try {
      const user = JSON.parse(userGuardado);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // Si el localStorage tiene algo corrupto, seguimos sin token
    }
  }
  return config;
});

// Estas rutas devuelven 401/400 como parte de su funcionamiento normal
// (contraseña incorrecta, código inválido...). No significan "sesión vencida".
const esRutaDeAuth = (url = "") => /\/Auth\//i.test(url);

// Si el backend responde 401 en una ruta protegida (token inválido o vencido),
// cerramos sesión y mandamos al login.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !esRutaDeAuth(error.config?.url)) {
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
