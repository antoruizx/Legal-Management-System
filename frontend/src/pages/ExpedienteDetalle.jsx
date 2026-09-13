import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExpediente } from "../api/expedientesApi";

export default function ExpedienteDetalle() {
  const { id } = useParams();
  const [expediente, setExpediente] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getExpediente(id)
      .then((response) => setExpediente(response.data))
      .catch(() => setError("No se pudo cargar el expediente"));
  }, [id]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!expediente) return <p>Cargando...</p>;

  return (
    <div>
      <Link to="/expedientes">← Volver a Expedientes</Link>

      <h2>{expediente.caratula}</h2>
      <p><strong>Número:</strong> {expediente.numero}</p>
      <p><strong>Estado:</strong> {expediente.estado}</p>
      <p>
        <strong>Cliente:</strong>{" "}
        {expediente.cliente ? `${expediente.cliente.nombre} ${expediente.cliente.apellido}` : "-"}
      </p>
      <p><strong>Fecha de inicio:</strong> {new Date(expediente.fechaInicio).toLocaleDateString()}</p>

      <hr />

      <h3>Movimientos</h3>
      {expediente.movimientos && expediente.movimientos.length > 0 ? (
        <ul>
          {expediente.movimientos.map((m) => (
            <li key={m.id}>
              <strong>{m.tipo}</strong> — {m.descripcion} ({new Date(m.fecha).toLocaleDateString()})
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay movimientos cargados todavía.</p>
      )}

      <h3>Tareas</h3>
      {expediente.tareas && expediente.tareas.length > 0 ? (
        <ul>
          {expediente.tareas.map((t) => (
            <li key={t.id}>
              <strong>{t.titulo}</strong> — Vence: {new Date(t.fechaVencimiento).toLocaleDateString()} {t.completada ? "✅" : "⏳"}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay tareas cargadas todavía.</p>
      )}
    </div>
  );
}