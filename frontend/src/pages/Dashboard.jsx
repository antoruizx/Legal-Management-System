import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Bienvenido, {user?.firstName} 👋</h2>
      <p>Este es el panel principal. Acá vamos a mostrar resúmenes de clientes, expedientes y tareas pendientes.</p>
    </div>
  );
}