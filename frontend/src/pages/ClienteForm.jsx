import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCliente, createCliente, updateCliente } from "../api/clientesApi";

export default function ClienteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      getCliente(id).then((response) => {
        setForm({
          nombre: response.data.nombre || "",
          apellido: response.data.apellido || "",
          dni: response.data.dni || "",
          email: response.data.email || "",
          telefono: response.data.telefono || "",
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

    try {
      if (isEdit) {
        await updateCliente(id, { id: Number(id), ...form });
      } else {
        await createCliente(form);
      }
      navigate("/clientes");
    } catch (err) {
      setError("Error al guardar el cliente. Revisá los datos.");
    }
  };

  return (
    <div>
      <h2>{isEdit ? "Editar Cliente" : "Nuevo Cliente"}</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Apellido</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>DNI</label>
          <input name="dni" value={form.dni} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Teléfono</label>
          <input name="telefono" value={form.telefono} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">{isEdit ? "Guardar cambios" : "Crear cliente"}</button>
      </form>
    </div>
  );
}