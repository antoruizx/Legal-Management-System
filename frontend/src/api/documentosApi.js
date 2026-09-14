import axiosClient from "./axiosClient";

export const getDocumentosPorExpediente = (expedienteId) =>
  axiosClient.get(`/Documentos?expedienteId=${expedienteId}`);

export const subirDocumento = (expedienteId, file, descripcion) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expedienteId", expedienteId);
  if (descripcion) formData.append("descripcion", descripcion);

  return axiosClient.post("/Documentos", formData, {
    headers: { "Content-Type": undefined },
  });
};

export const descargarDocumentoUrl = (id) =>
  `${axiosClient.defaults.baseURL}/Documentos/${id}/download`;

export const eliminarDocumento = (id) => axiosClient.delete(`/Documentos/${id}`);