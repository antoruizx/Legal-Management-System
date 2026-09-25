import axiosClient from "./axiosClient";

export const getExpedientes = () => axiosClient.get("/Expedientes");
export const getExpediente = (id) => axiosClient.get(`/Expedientes/${id}`);
export const createExpediente = (data, actorUserId) =>
  axiosClient.post(`/Expedientes?actorUserId=${actorUserId}`, data);
export const updateExpediente = (id, data) => axiosClient.put(`/Expedientes/${id}`, data);
export const deleteExpediente = (id) => axiosClient.delete(`/Expedientes/${id}`);