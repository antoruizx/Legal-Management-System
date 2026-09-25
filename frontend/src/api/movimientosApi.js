import axiosClient from "./axiosClient";

export const getMovimientosPorExpediente = (expedienteId, desde, hasta) => {
  const params = new URLSearchParams({ expedienteId });
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);
  return axiosClient.get(`/Movimientos?${params.toString()}`);
};

export const crearMovimiento = (data) => axiosClient.post("/Movimientos", data);

export const eliminarMovimiento = (id) => axiosClient.delete(`/Movimientos/${id}`);