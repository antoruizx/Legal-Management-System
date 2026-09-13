import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCliente, createCliente, updateCliente } from "../api/clientesApi";
import BackButton from "../components/BackButton";

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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);

    try {
      if (isEdit) {
        await updateCliente(id, { id: Number(id), ...form });
      } else {
        await createCliente(form);
      }
      navigate(isEdit ? `/clientes/${id}` : "/clientes");
    } catch (err) {
      setError("Error al guardar el cliente. Revisá los datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <BackButton />

      <div className="card form-card">
        <h2 style={{ marginBottom: "4px" }}>{isEdit ? "Editar Cliente" : "Nuevo Cliente"}</h2>
        <p className="detail-subtitle" style={{ marginBottom: "20px" }}>
          {isEdit ? "Actualizá los datos de contacto del cliente." : "Completá los datos para dar de alta un nuevo cliente."}
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Apellido</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-field">
            <label>DNI</label>
            <input name="dni" value={form.dni} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-field">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%", marginTop: "8px" }}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
          </button>
        </form>
      </div>
    </div>
  );
}
