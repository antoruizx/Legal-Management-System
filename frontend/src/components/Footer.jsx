export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "20px",
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        padding: "20px clamp(16px, 3vw, 32px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>⚖️</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text-hi)" }}>
              Desarrollo
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-lo)" }}>
              👩‍💻 Nadia Antonella Ruiz
            </div>
          </div>
        </div>

        <a href="mailto:antoruizx23@gmail.com" className="link-action" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>📧</span> antoruizx23@gmail.com
        </a>
      </div>
    </footer>
  );
}