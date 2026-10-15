// Marca sobre fondo oscuro. `grande` es la versión del login (ícono blanco).
export default function Logo({ grande = false }) {
  return (
    <div className={`brand${grande ? " brand-grande" : ""}`}>
      <img src={grande ? "/foja-icono-claro.svg" : "/foja-icono.svg"} alt="" />
      <div>
        <div className="brand-name">Foja</div>
        <div className="brand-sub">Gestión jurídica</div>
      </div>
    </div>
  );
}
