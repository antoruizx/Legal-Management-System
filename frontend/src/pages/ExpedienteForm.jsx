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

    const payload = { ...form, clienteId: Number(form.clienteId) };

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
      <h2>{isEdit ? "Editar Expediente" : "Nuevo Expediente"}</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Número</label>
          <input name="numero" value={form.numero} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Carátula</label>
          <input name="caratula" value={form.caratula} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} style={{ width: "100%", padding: "8px" }}>
            <option value="Activo">Activo</option>
            <option value="En trámite">En trámite</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Archivado">Archivado</option>
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Cliente</label>
          <select name="clienteId" value={form.clienteId} onChange={handleChange} required style={{ width: "100%", padding: "8px" }}>
            <option value="">-- Seleccionar cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">{isEdit ? "Guardar cambios" : "Crear expediente"}</button>
      </form>
    </div>
  );
}