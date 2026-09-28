export default function ConfirmDialog({ abierto, titulo, mensaje, onConfirmar, onCancelar, textoConfirmar = "Eliminar" }) {
  if (!abierto) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancelar}
    >
      <div
        className="card"
        style={{ maxWidth: 380, width: "90%", padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 10 }}>{titulo}</h3>
        <p style={{ color: "var(--text-lo)", fontSize: 14, marginBottom: 20 }}>{mensaje}</p>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className="btn-primary btn"
            style={{ flex: 1, background: "var(--danger)", borderColor: "var(--danger)" }}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}