import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5160/api",
  headers: {
    "Content-Type": "application/json",
  },
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

// Si el backend responde 401 (token inválido o vencido), cerramos sesión
// y mandamos al login para que la persona vuelva a autenticarse.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;