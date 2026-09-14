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
    userId: 1,
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
          fechaVencimiento: response.data.fechaVencimiento ? response.data.fechaVencimiento.substring(0, 10) : "",
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
      setError("Error al guardar la tarea. Revisa los datos.");
    }
  };

  return (
    <div>
      <BackButton />
      <h2 style={{ marginBottom: "20px" }}>{isEdit ? "Editar Tarea" : "Nueva Tarea"}</h2>
      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-field">
          <label>Titulo</label>
          <input name="titulo" value={form.titulo} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label>Descripcion</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} />
        </div>
        <div className="form-field">
          <label>Fecha de vencimiento</label>
          <input type="date" name="fechaVencimiento" value={form.fechaVencimiento} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label>Expediente</label>
          <select name="expedienteId" value={form.expedienteId} onChange={handleChange} required>
            <option value="">-- Seleccionar expediente --</option>
            {expedientes.map((e) => (
              <option key={e.id} value={e.id}>{e.numero} - {e.caratula}</option>
            ))}
          </select>
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
        <button type="submit" className="btn btn-primary">
          {isEdit ? "Guardar cambios" : "Crear tarea"}
        </button>
      </form>
    </div>
  );
}
