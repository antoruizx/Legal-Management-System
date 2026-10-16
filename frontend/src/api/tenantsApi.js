import axiosClient from "./axiosClient";

// Público: crea un estudio nuevo con su primer usuario Admin y devuelve la sesión ya iniciada
export const registerTenant = (data) => axiosClient.post("/Tenants/register", data);

// Solo superadmin: panel de estudios
export const getTenants = () => axiosClient.get("/Tenants");
export const setTenantActive = (id, active) => axiosClient.put(`/Tenants/${id}/active`, { active });
export const extenderPrueba = (id, dias) => axiosClient.put(`/Tenants/${id}/extender-prueba`, { dias });
export const activarPago = (id) => axiosClient.put(`/Tenants/${id}/activar-pago`);

// Solo superadmin: vendedores
export const getVendedores = () => axiosClient.get("/Vendedores");
export const crearVendedor = (data) => axiosClient.post("/Vendedores", data);

// Vendedores y superadmin: códigos de prueba de un solo uso
export const getCodigos = () => axiosClient.get("/Codigos");
export const crearCodigo = () => axiosClient.post("/Codigos");
export const anularCodigo = (id) => axiosClient.delete(`/Codigos/${id}`);
