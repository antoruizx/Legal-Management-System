import axiosClient from "./axiosClient";

export const cargarDatosDemo = () => axiosClient.post("/Demo");
export const quitarDatosDemo = () => axiosClient.delete("/Demo");
