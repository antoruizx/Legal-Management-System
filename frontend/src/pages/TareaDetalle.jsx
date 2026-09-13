import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTarea } from "../api/tareasApi";
import BackButton from "../components/BackButton";

export default function TareaDetalle() {
  const { id } = useParams();
  const [tarea, setTarea] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTarea(id)
      .then((response) => setTarea(response.data))
      .catch(() => setError("No se pudo cargar la tarea"));
  }, [id]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!tarea) return <p>Cargando...</p>;

  return (
    <div>
      <BackButton />
      <h2>{tarea.titulo}</h2>
      <p><strong>Descripción:</strong> {tarea.descripcion || "-"}</p>
      <p><strong>Vencimiento:</strong> {new Date(tarea.fechaVencimiento).toLocaleDateString()}</p>
      <p><strong>Estado:</strong> {tarea.completada ? "Completada ✅" : "Pendiente ⏳"}</p>
      <p><strong>Expediente:</strong> {tarea.expediente ? `${tarea.expediente.numero} - ${tarea.expediente.caratula}` : "-"}</p>
      <p><strong>Responsable:</strong> {tarea.user ? `${tarea.user.firstName} ${tarea.user.lastName}` : "-"}</p>
      <p><strong>Fecha de creación:</strong> {new Date(tarea.fechaCreacion).toLocaleDateString()}</p>
    </div>
  );
}