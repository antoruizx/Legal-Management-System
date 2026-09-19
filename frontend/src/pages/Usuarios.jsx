import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from "../api/usersApi";
import BackButton from "../components/BackButton";
import { useAuth } from "../context/AuthContext";

function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}

function getRoleBadge(role) {
  switch (role) {
    case "Admin":
      return "badge-danger";
    case "Abogado":
      return "badge-info";
    default:
      return "badge-neutral";
  }
}

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsers();
  }, []);

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      alert("No podés eliminar tu propio usuario mientras estás logueado con él.");
      return;
    }
    if (!confirm("¿Seguro que querés eliminar este usuario? Esta acción no se puede deshacer.")) return;

    try {
      await deleteUser(id);
      cargarUsers();
    } catch (err) {
      alert("No se pudo eliminar el usuario");
    }
  };

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <div className="page-header">
        <BackButton />
        <h2>Usuarios</h2>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Usuario">
                  <Link to={`/usuarios/${u.id}`} className="client-list-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="client-avatar">{iniciales(u.firstName, u.lastName)}</div>
                    <span>{u.firstName} {u.lastName}</span>
                    {u.id === currentUser?.id && <span className="badge badge-info" style={{ marginLeft: 6 }}>vos</span>}
                  </Link>
                </td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Rol">
                  <span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span>
                </td>
                <td data-label="Acciones">
                  <Link to={`/usuarios/${u.id}`} className="link-action">Ver ficha</Link>
                  {" · "}
                  <button className="btn-danger-ghost" onClick={() => handleDelete(u.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <p className="empty-state">No hay usuarios cargados.</p>}
      </div>
    </div>
  );
}
