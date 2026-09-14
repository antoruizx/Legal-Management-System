import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExpediente, createExpediente, updateExpediente } from "../api/expedientesApi";
import { getClientes } from "../api/clientesApi";
import BackButton from "../components/BackButton";

export default function ExpedienteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({
    numero: "",
    caratula: "",
    estado: "Activo",
    fechaInicio: "",
    clienteId: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    getClientes().then((response) => setClientes(response.data));

    if (isEdit) {
      getExpediente(id).then((response) => {
        setForm({
          numero: response.data.numero || "",
          caratula: response.data.caratula || "",
          estado: response.data.estado || "Activo",
          fechaInicio: response.data.fechaInicio
            ? response.data.fechaInicio.substring(0, 10)
            : "",
          clienteId: response.data.clienteId || "",
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
      clienteId: Number(form.clienteId),
      fechaInicio: new Date(form.fechaInicio).toISOString(),
    };

    try {
      if (isEdit) {
        await updateExpediente(id, { id: Number(id), ...payload });
      } else {
        await createExpediente(payload);
      }
      navigate("/expedientes");
    } catch (err) {
      setError("Error al guardar el expediente. Revisá los datos.");
    }
  };

  return (
    <div>
      <BackButton />
      <h2 style={{ marginBottom: "20px" }}>{isEdit ? "Editar Expediente" : "Nuevo Expediente"}</h2>

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-field">
          <label>Número</label>
          <input name="numero" value={form.numero} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label>Carátula</label>
          <input name="caratula" value={form.caratula} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label>Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} required>
            <option value="Activo">Activo</option>
            <option value="En trámite">En trámite</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Archivado">Archivado</option>
          </select>
        </div>

        <div className="form-field">
          <label>Fecha de inicio</label>
          <input
            type="date"
            name="fechaInicio"
            value={form.fechaInicio}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label>Cliente</label>
          <select name="clienteId" value={form.clienteId} onChange={handleChange} required>
            <option value="">-- Seleccionar cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}

        <button type="submit" className="btn btn-primary">
          {isEdit ? "Guardar cambios" : "Crear expediente"}
        </button>
      </form>
    </div>
  );
}