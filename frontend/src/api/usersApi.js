import axiosClient from "./axiosClient";

export const getUsers = () => axiosClient.get("/Users");
export const getUser = (id) => axiosClient.get(`/Users/${id}`);
export const createUser = (data) => axiosClient.post("/Users", data);
export const updateUser = (id, data) => axiosClient.put(`/Users/${id}`, data);
export const deleteUser = (id) => axiosClient.delete(`/Users/${id}`);
