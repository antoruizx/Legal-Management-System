import axiosClient from "./axiosClient";

// Público: crea un estudio nuevo con su primer usuario Admin y devuelve la sesión ya iniciada
export const registerTenant = (data) => axiosClient.post("/Tenants/register", data);

// Solo superadmin: panel de estudios
export const getTenants = () => axiosClient.get("/Tenants");
export const setTenantActive = (id, active) => axiosClient.put(`/Tenants/${id}/active`, { active });
