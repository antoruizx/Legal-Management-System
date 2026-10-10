import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getTenants, setTenantActive } from "../api/tenantsApi";
import BackButton from "../components/BackButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR");
}

// Panel del superadmin: lista todos los estudios de la app y permite activarlos o desactivarlos
export default function Estudios() {
  const { user } = useAuth();

  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);
  const [aDesactivar, setADesactivar] = useState(null);

  useEffect(() => {
    if (!user?.esSuperAdmin) return;
    getTenants()
      .then((response) => setEstudios(response.data))
      .catch(() => setError("No se pudieron cargar los estudios"))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user?.esSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const cambiarEstado = async (estudio, active) => {
    setGuardandoId(estudio.id);
    try {
      await setTenantActive(estudio.id, active);
      setEstudios((prev) => prev.map((e) => (e.id === estudio.id ? { ...e, active } : e)));
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo actualizar el estudio");
    } finally {
      setGuardandoId(null);
    }
  };

  const confirmarDesactivar = () => {
    const estudio = aDesactivar;
    setADesactivar(null);
    cambiarEstado(estudio, false);
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <div className="page-header">
        <BackButton to="/dashboard" />
        <h2>Estudios</h2>
      </div>

      <p style={{ color: "var(--text-lo)", fontSize: 13, marginBottom: 16 }}>
        Todos los estudios registrados en la aplicación. Los usuarios de un estudio desactivado no pueden
        iniciar sesión; quienes ya tenían la sesión abierta siguen entrando hasta que se les vence.
      </p>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Estudio</th>
              <th>Administrador</th>
              <th>Usuarios</th>
              <th>Alta</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {estudios.map((e) => {
              const esElPropio = e.id === user.tenantId;
              return (
                <tr key={e.id}>
                  <td data-label="Estudio">
                    <div className="client-list-card">
                      <div className="client-avatar">{iniciales(e.name)}</div>
                      <div>
                        <div>{e.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-lo)" }}>{e.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Administrador">{e.adminEmail || "—"}</td>
                  <td data-label="Usuarios">{e.usuarios}</td>
                  <td data-label="Alta">{formatearFecha(e.createdAt)}</td>
                  <td data-label="Estado">
                    <span className={`badge ${e.active ? "badge-success" : "badge-danger"}`}>
                      {e.active ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td data-label="Acción">
                    {esElPropio ? (
                      <span style={{ fontSize: 12, color: "var(--text-lo)" }}>Tu estudio</span>
                    ) : e.active ? (
                      <button
                        className="btn btn-danger-ghost"
                        disabled={guardandoId === e.id}
                        onClick={() => setADesactivar(e)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="btn"
                        disabled={guardandoId === e.id}
                        onClick={() => cambiarEstado(e, true)}
                      >
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {estudios.length === 0 && <p className="empty-state">No hay estudios registrados todavía.</p>}
      </div>

      <ConfirmDialog
        abierto={Boolean(aDesactivar)}
        titulo="Desactivar estudio"
        mensaje={`Los usuarios de "${aDesactivar?.name}" no van a poder iniciar sesión hasta que lo vuelvas a activar. Sus datos no se borran.`}
        textoConfirmar="Desactivar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setADesactivar(null)}
      />
    </div>
  );
}
