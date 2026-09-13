import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExpedientes, deleteExpediente } from "../api/expedientesApi";

export default function Expedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarExpedientes = async () => {
    setLoading(true);
    try {
      const response = await getExpedientes();
      setExpedientes(response.data);
    } catch (err) {
      setError("No se pudieron cargar los expedientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este expediente?")) return;

    try {
      await deleteExpediente(id);
      cargarExpedientes();
    } catch (err) {
      alert("No se pudo eliminar el expediente");
    }
  };

  if (loading) return <p>Cargando expedientes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Expedientes</h2>
        <Link to="/expedientes/nuevo">
          <button>+ Nuevo Expediente</button>
        </Link>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Número</th>
            <th>Carátula</th>
            <th>Estado</th>
            <th>Cliente</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expedientes.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{e.numero}</td>
              <td>
                <Link to={`/expedientes/${e.id}`}>{e.caratula}</Link>
              </td>
              <td>{e.estado}</td>
              <td>{e.cliente ? `${e.cliente.nombre} ${e.cliente.apellido}` : "-"}</td>
              <td>
                <Link to={`/expedientes/${e.id}/editar`}>Editar</Link>
                {" | "}
                <button onClick={() => handleDelete(e.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {expedientes.length === 0 && <p>No hay expedientes cargados todavía.</p>}
    </div>
  );
}