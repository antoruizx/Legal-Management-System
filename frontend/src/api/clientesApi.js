import axiosClient from "./axiosClient";

export const getClientes = () => axiosClient.get("/Clientes");
export const getCliente = (id) => axiosClient.get(`/Clientes/${id}`);
export const createCliente = (data) => axiosClient.post("/Clientes", data);
export const updateCliente = (id, data) => axiosClient.put(`/Clientes/${id}`, data);
export const deleteCliente = (id) => axiosClient.delete(`/Clientes/${id}`);