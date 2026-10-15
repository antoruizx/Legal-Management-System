import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { iniciales } from "../utils/tareas";
import {
  ACUERDOS,
  COBROS,
  LIQUIDACIONES,
  PARTICIPACION,
  PENDIENTE_DE_COBRO,
  formatoPesos,
} from "../data/honorariosEjemplo";

const COBRO_VACIO = { cliente: "", concepto: "", monto: "" };

function fechaCorta(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function Indicador({ icon, label, value, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-icon"><Icon name={icon} size={22} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

// Pantalla con datos de ejemplo: lo que se registra acá vive solo en memoria
// hasta que exista el módulo de honorarios en la API.
export default function Honorarios() {
  const { user } = useAuth();
  const [cobros, setCobros] = useState(COBROS);
  const [liquidaciones, setLiquidaciones] = useState(LIQUIDACIONES);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState(COBRO_VACIO);

  const titular = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Titular";
  const mes = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const cobrado = cobros.reduce((acc, c) => acc + c.monto, 0);
  const aPagar = liquidaciones.reduce((acc, l) => acc + l.cobrado * PARTICIPACION, 0);
  const pagadas = liquidaciones.filter((l) => l.pagado);
  const liquidado = pagadas.reduce((acc, l) => acc + l.cobrado * PARTICIPACION, 0);

  const handleRegistrar = (e) => {
    e.preventDefault();
    const monto = Number(nuevo.monto);
    if (!nuevo.cliente.trim() || !monto) return;
    setCobros([{ diasAtras: 0, cliente: nuevo.cliente.trim(), concepto: nuevo.concepto.trim() || "Cobro", monto }, ...cobros]);
    setNuevo(COBRO_VACIO);
    setMostrarForm(false);
  };

  const handleLiquidar = () => {
    setLiquidaciones(liquidaciones.map((l) => ({ ...l, pagado: true })));
  };

  return (
    <div className="dashboard">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-title">Honorarios</h2>
          <p className="page-subtitle">
            {mes.charAt(0).toUpperCase() + mes.slice(1)}{" "}
            <span className="tag-ejemplo" title="Todavía no hay módulo de honorarios en la API">Datos de ejemplo</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => setMostrarForm(!mostrarForm)}>Registrar cobro</button>
          <button className="btn btn-primary" onClick={handleLiquidar} disabled={pagadas.length === liquidaciones.length}>
            Liquidar mes
          </button>
        </div>
      </div>

      {mostrarForm && (
        <form className="card inline-form" style={{ marginBottom: 0 }} onSubmit={handleRegistrar}>
          <input className="input" placeholder="Cliente" value={nuevo.cliente} onChange={(e) => setNuevo({ ...nuevo, cliente: e.target.value })} required />
          <input className="input" placeholder="Concepto" value={nuevo.concepto} onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} />
          <input className="input" type="number" min="1" placeholder="Monto" value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} required />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </form>
      )}

      <div className="kpi-row">
        <Indicador icon="wallet" label="Cobrado este mes" value={formatoPesos(cobrado)} sub={`${cobros.length} cobros registrados`} />
        <Indicador icon="clock" label="Pendiente de cobro" value={formatoPesos(PENDIENTE_DE_COBRO.monto)} sub={`${PENDIENTE_DE_COBRO.clientes} clientes`} />
        <Indicador icon="users" label="A pagar a abogados" value={formatoPesos(aPagar)} sub={`${liquidaciones.length} abogados`} />
        <Indicador icon="tasks" label="Ya liquidado" value={formatoPesos(liquidado)} sub={`${pagadas.length} de ${liquidaciones.length} abogados`} />
      </div>

      <div className="two-cols two-cols-ancha">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Liquidación por abogado</h3>
            <span className="card-caption">Según % de participación</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Abogado</th>
                <th title="Expedientes">Exp.</th>
                <th>Cobrado</th>
                <th>Le corresponde</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {liquidaciones.map((l) => {
                const nombre = l.abogado || titular;
                // Para las iniciales se saltea el "Dr."/"Dra." de los nombres de ejemplo
                const partes = nombre.replace(/^Dra?\. /, "").split(" ");
                return (
                  <tr key={nombre}>
                    <td data-label="Abogado">
                      <div className="client-list-card">
                        <div className="client-avatar">{iniciales(partes[0], partes[1])}</div>
                        <span style={{ whiteSpace: "nowrap" }}>{nombre}</span>
                      </div>
                    </td>
                    <td data-label="Expedientes">{l.expedientes}</td>
                    <td data-label="Cobrado">{formatoPesos(l.cobrado)}</td>
                    <td data-label="Le corresponde" style={{ fontWeight: 700 }}>{formatoPesos(l.cobrado * PARTICIPACION)}</td>
                    <td data-label="Estado">
                      <span className={`badge ${l.pagado ? "badge-success" : "badge-warning"}`}>
                        <span className={`badge-dot ${l.pagado ? "dot-success" : "dot-warning"}`}></span>
                        {l.pagado ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 12 }}>Últimos cobros</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th style={{ textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {cobros.map((c, i) => (
                <tr key={`${c.cliente}-${c.concepto}-${i}`}>
                  <td data-label="Fecha">{fechaCorta(c.diasAtras)}</td>
                  <td data-label="Cliente">{c.cliente}</td>
                  <td data-label="Concepto" style={{ color: "var(--text-lo)" }}>{c.concepto}</td>
                  <td data-label="Monto" className="monto">{formatoPesos(c.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 12 }}>Honorarios pactados por expediente</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Expediente</th>
              <th>Cliente</th>
              <th>Pactado</th>
              <th>Cobrado</th>
              <th>Saldo</th>
              <th>Participación</th>
            </tr>
          </thead>
          <tbody>
            {ACUERDOS.map((a) => (
              <tr key={a.expediente}>
                <td data-label="Expediente" style={{ fontWeight: 700 }}>{a.expediente}</td>
                <td data-label="Cliente">{a.cliente}</td>
                <td data-label="Pactado">{formatoPesos(a.pactado)} en {a.cuotas} cuotas</td>
                <td data-label="Cobrado">{formatoPesos(a.cobrado)}</td>
                <td data-label="Saldo" style={{ fontWeight: 700 }}>{formatoPesos(a.pactado - a.cobrado)}</td>
                <td data-label="Participación" style={{ color: "var(--text-lo)" }}>{a.participacion.replace("Titular", titular)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
