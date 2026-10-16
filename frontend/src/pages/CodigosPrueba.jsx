import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCodigos, crearCodigo, anularCodigo } from "../api/tenantsApi";
import { useAuth } from "../context/AuthContext";
import { estadoComercial } from "../utils/prueba";

function linkDeRegistro(codigo) {
  return `${window.location.origin}/registro?codigo=${codigo}`;
}

function mensajeInvitacion(codigo) {
  return (
    "¡Hola! Te paso tu acceso de prueba a Foja, el sistema de gestión para estudios jurídicos.\n\n" +
    `Registrá tu estudio acá: ${linkDeRegistro(codigo)}\n` +
    `Código de invitación: ${codigo}\n\n` +
    "Tenés 7 días de prueba gratis. Cualquier duda, escribime."
  );
}

function estadoCodigo(c) {
  if (c.usadoEl) return { label: "Usado", clase: "badge-success" };
  if (new Date(c.venceEl) < new Date()) return { label: "Vencido", clase: "badge-neutral" };
  return { label: "Sin usar", clase: "badge-info" };
}

// Vendedores y superadmin: generan códigos de un solo uso para que un cliente registre
// su estudio con 7 días de prueba, y siguen en qué quedó cada uno.
export default function CodigosPrueba() {
  const { user } = useAuth();
  const habilitado = user?.esVendedor || user?.esSuperAdmin;

  const [codigos, setCodigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);
  const [copiado, setCopiado] = useState(null);

  const cargar = () =>
    getCodigos()
      .then((response) => setCodigos(response.data))
      .catch(() => setError("No se pudieron cargar los códigos"))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (habilitado) cargar();
  }, [habilitado]);

  if (!habilitado) return <Navigate to="/dashboard" replace />;

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      await crearCodigo();
      await cargar();
    } catch {
      alert("No se pudo generar el código");
    } finally {
      setGenerando(false);
    }
  };

  const handleCopiar = async (texto, clave) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      prompt("Copiá el texto:", texto);
    }
  };

  const handleAnular = async (c) => {
    if (!confirm(`¿Anular el código ${c.codigo}? Ya no se va a poder usar.`)) return;
    try {
      await anularCodigo(c.id);
      setCodigos((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo anular el código");
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div className="dashboard">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-title">Códigos de prueba</h2>
          <p className="page-subtitle" style={{ color: "var(--text-lo)" }}>
            Cada código sirve una sola vez y vence a los 30 días si no se usa. El estudio que se registra con él
            tiene 7 días de prueba gratis.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerar} disabled={generando}>
          {generando ? "Generando..." : "+ Generar código"}
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              {user.esSuperAdmin && <th>Vendedor</th>}
              <th>Creado</th>
              <th>Estado</th>
              <th>Estudio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {codigos.map((c) => {
              const estado = estadoCodigo(c);
              const disponible = estado.label === "Sin usar";
              return (
                <tr key={c.id}>
                  <td data-label="Código" style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 15 }}>{c.codigo}</td>
                  {user.esSuperAdmin && <td data-label="Vendedor">{c.vendedor || "—"}</td>}
                  <td data-label="Creado">{new Date(c.creadoEl).toLocaleDateString("es-AR")}</td>
                  <td data-label="Estado"><span className={`badge ${estado.clase}`}>{estado.label}</span></td>
                  <td data-label="Estudio">
                    {c.estudio ? (
                      <div>
                        <div>{c.estudio.name}</div>
                        <span className={`badge ${estadoComercial(c.estudio).clase}`}>{estadoComercial(c.estudio).label}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td data-label="Acciones">
                    {disponible ? (
                      <>
                        <button className="link-strong link-action" onClick={() => handleCopiar(mensajeInvitacion(c.codigo), `m-${c.id}`)}>
                          {copiado === `m-${c.id}` ? "¡Copiado!" : "Copiar invitación"}
                        </button>
                        {" · "}
                        <button className="link-action" onClick={() => handleCopiar(c.codigo, `c-${c.id}`)}>
                          {copiado === `c-${c.id}` ? "¡Copiado!" : "Copiar código"}
                        </button>
                        {" · "}
                        <button className="btn-danger-ghost" onClick={() => handleAnular(c)}>Anular</button>
                      </>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {codigos.length === 0 && (
          <p className="empty-state">Todavía no generaste códigos. Tocá "Generar código" y mandale la invitación a tu cliente.</p>
        )}
      </div>
    </div>
  );
}
