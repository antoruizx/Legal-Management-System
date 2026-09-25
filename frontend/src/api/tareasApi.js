import axiosClient from "./axiosClient";

export const getTareas = () => axiosClient.get("/Tareas");
export const getTarea = (id) => axiosClient.get(`/Tareas/${id}`);
export const createTarea = (data, actorUserId) =>
  axiosClient.post(`/Tareas?actorUserId=${actorUserId}`, data);
export const updateTarea = (id, data) => axiosClient.put(`/Tareas/${id}`, data);
export const deleteTarea = (id) => axiosClient.delete(`/Tareas/${id}`);