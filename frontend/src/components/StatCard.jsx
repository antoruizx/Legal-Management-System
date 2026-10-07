import Icon from "./Icon";

// Indicador del dashboard. `ejemplo` marca que el valor todavía no sale de la API.
export default function StatCard({ icon, label, value, sub, ejemplo = false }) {
  return (
    <div className="kpi">
      <div className="kpi-icon">
        <Icon name={icon} size={22} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-label">
          {label}
          {ejemplo && <span className="tag-ejemplo" title="Dato de ejemplo: todavía no hay endpoint">Ejemplo</span>}
        </div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
