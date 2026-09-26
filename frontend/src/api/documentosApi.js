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

// Descarga el archivo autenticado (con el token) y dispara la descarga
// en el navegador simulando el click en un link temporal.
export const descargarDocumento = async (id, nombreOriginal) => {
  const response = await axiosClient.get(`/Documentos/${id}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nombreOriginal);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const eliminarDocumento = (id) => axiosClient.delete(`/Documentos/${id}`);