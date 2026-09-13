import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTarea, createTarea, updateTarea } from "../api/tareasApi";
import { getExpedientes } from "../api/expedientesApi";
import BackButton from "../components/BackButton";

export default function TareaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [expedientes, setExpedientes] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fechaVencimiento: "",
    expedienteId: "",
    userId: 1, // TODO: reemplazar por el usuario logueado cuando haya selección de responsable
    completada: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    getExpedientes().then((response) => setExpedientes(response.data));

    if (isEdit) {
      getTarea(id).then((response) => {
        setForm({
          titulo: response.data.titulo || "",
          descripcion: response.data.descripcion || "",
          fechaVencimiento: response.data.fechaVencimiento
            ? response.data.fechaVencimiento.substring(0, 10)
            : "",
          expedienteId: response.data.expedienteId || "",
          userId: response.data.userId || 1,
          completada: response.data.completada || false,
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      ...form,
      expedienteId: Number(form.expedienteId),
      userId: Number(form.userId),
      fechaVencimiento: new Date(form.fechaVencimiento).toISOString(),
    };

    try {
      if (isEdit) {
        await updateTarea(id, { id: Number(id), ...payload });
      } else {
        await createTarea(payload);
      }
      navigate("/tareas");
    } catch (err) {
      setError("Error al guardar la tarea. Revisá los datos.");
    }
  };

  return (
    <div>
    <BackButton />
      <h2>{isEdit ? "Editar Tarea" : "Nueva Tarea"}</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Título</label>
          <input name="titulo" value={form.titulo} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Descripción</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Fecha de vencimiento</label>
          <input
            type="date"
            name="fechaVencimiento"
            value={form.fechaVencimiento}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Expediente</label>
          <select name="expedienteId" value={form.expedienteId} onChange={handleChange} required style={{ width: "100%", padding: "8px" }}>
            <option value="">-- Seleccionar expediente --</option>
            {expedientes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.numero} - {e.caratula}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">{isEdit ? "Guardar cambios" : "Crear tarea"}</button>
      </form>
    </div>
  );
}