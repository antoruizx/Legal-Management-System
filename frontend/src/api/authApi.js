import axiosClient from "./axiosClient";

export const changePassword = (currentPassword, newPassword) =>
  axiosClient.post("/Auth/change-password", { currentPassword, newPassword });

// Solo Admin: manda un mail de prueba a tu propio email y devuelve la respuesta de Brevo
export const testEmail = () => axiosClient.post("/Auth/test-email");
