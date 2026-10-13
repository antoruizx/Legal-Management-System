export default function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img src="/foja-icono.svg" alt="" width="34" height="34" />
      <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>Foja</h3>
    </div>
  );
}