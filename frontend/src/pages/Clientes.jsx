import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClientes, deleteCliente } from "../api/clientesApi";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await getClientes();
      setClientes(response.data);
    } catch (err) {
      setError("No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este cliente?")) return;

    try {
      await deleteCliente(id);
      cargarClientes();
    } catch (err) {
      alert("No se pudo eliminar el cliente");
    }
  };

  if (loading) return <p>Cargando clientes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Clientes</h2>
        <Link to="/clientes/nuevo">
          <button>+ Nuevo Cliente</button>
        </Link>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>DNI</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{c.nombre}</td>
              <td>{c.apellido}</td>
              <td>{c.dni}</td>
              <td>{c.email}</td>
              <td>{c.telefono}</td>
              <td>
                <Link to={`/clientes/${c.id}/editar`}>Editar</Link>
                {" | "}
                <button onClick={() => handleDelete(c.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {clientes.length === 0 && <p>No hay clientes cargados todavía.</p>}
    </div>
  );
}