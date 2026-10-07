import { useState } from "react";

// Gráfico de área de una sola serie, en SVG y sin dependencias.
// data: [{ label: "oct", value: 4, detalle: "octubre 2026" }]
const ANCHO = 100;
const ALTO = 100;

function techoRedondo(max) {
  if (max <= 4) return 4;
  const paso = Math.pow(10, Math.floor(Math.log10(max)));
  const techo = Math.ceil(max / paso) * paso;
  return techo % 2 === 0 ? techo : techo + paso;
}

export default function AreaChart({ data, unidad = "" }) {
  const [activo, setActivo] = useState(null);

  if (!data || data.length < 2) return null;

  const techo = techoRedondo(Math.max(...data.map((d) => d.value)));
  const x = (i) => (i / (data.length - 1)) * ANCHO;
  const y = (v) => ALTO - (v / techo) * ALTO;

  const linea = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${linea} L${ANCHO},${ALTO} L0,${ALTO} Z`;
  const marcas = [techo, techo / 2, 0];

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const proporcion = (e.clientX - rect.left) / rect.width;
    const i = Math.round(proporcion * (data.length - 1));
    setActivo(Math.max(0, Math.min(data.length - 1, i)));
  };

  const punto = activo !== null ? data[activo] : null;

  return (
    <div className="area-chart">
      <div
        className="area-chart-plot"
        onMouseMove={handleMove}
        onMouseLeave={() => setActivo(null)}
      >
        {marcas.map((m) => (
          <span key={m} className="area-chart-ytick" style={{ top: `${y(m)}%` }}>{m}</span>
        ))}

        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
          {marcas.map((m) => (
            <line key={m} className="grid-line" x1="0" x2={ANCHO} y1={y(m)} y2={y(m)} vectorEffect="non-scaling-stroke" />
          ))}
          <path className="area-fill" d={area} />
          <path className="area-line" d={linea} vectorEffect="non-scaling-stroke" />
          {punto && (
            <line className="crosshair" x1={x(activo)} x2={x(activo)} y1="0" y2={ALTO} vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {punto && (
          <>
            <span className="area-chart-dot" style={{ left: `${x(activo)}%`, top: `${y(punto.value)}%` }} />
            <div className="area-chart-tooltip" style={{ left: `${x(activo)}%`, top: `${y(punto.value)}%` }}>
              <strong>{punto.value} {unidad}</strong>
              <span>{punto.detalle || punto.label}</span>
            </div>
          </>
        )}
      </div>

      <div className="area-chart-xaxis">
        {data.map((d) => <span key={d.detalle || d.label}>{d.label}</span>)}
      </div>

      {/* Mismos datos en tabla, para lectores de pantalla */}
      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.detalle || d.label}>
              <th scope="row">{d.detalle || d.label}</th>
              <td>{d.value} {unidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
