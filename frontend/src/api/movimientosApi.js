import axiosClient from "./axiosClient";

// Sin expedienteId devuelve los movimientos de todo el estudio (Historial y Métricas)
export const getMovimientosPorExpediente = (expedienteId, desde, hasta) => {
  const params = new URLSearchParams();
  if (expedienteId) params.append("expedienteId", expedienteId);
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);
  return axiosClient.get(`/Movimientos?${params.toString()}`);
};

export const crearMovimiento = (data) => axiosClient.post("/Movimientos", data);

export const eliminarMovimiento = (id) => axiosClient.delete(`/Movimientos/${id}`);
