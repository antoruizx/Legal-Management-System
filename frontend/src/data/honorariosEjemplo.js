// Datos de ejemplo: la API todavía no tiene honorarios. Cuando existan los endpoints,
// reemplazar por la respuesta real (los usan la pantalla Honorarios y el Panel).

// Porcentaje de lo cobrado que le corresponde al abogado
export const PARTICIPACION = 0.4;

export const PENDIENTE_DE_COBRO = { monto: 1250000, clientes: 6 };

// El primer renglón de la liquidación es siempre quien inició sesión
export const LIQUIDACIONES = [
  { abogado: null, expedientes: 5, cobrado: 520000, pagado: true },
  { abogado: "Dr. Martín Salas", expedientes: 4, cobrado: 430000, pagado: true },
  { abogado: "Dra. Rocío Cano", expedientes: 3, cobrado: 310000, pagado: false },
  { abogado: "Dr. Diego Herrera", expedientes: 3, cobrado: 290000, pagado: false },
  { abogado: "Dra. Valentina Molina", expedientes: 2, cobrado: 240000, pagado: false },
  { abogado: "Dra. Camila Ortiz", expedientes: 2, cobrado: 200000, pagado: false },
  { abogado: "Dr. Federico Luna", expedientes: 1, cobrado: 150000, pagado: false },
];

// diasAtras: hace cuántos días se registró el cobro
export const COBROS = [
  { diasAtras: 1, cliente: "Marta Gómez", concepto: "Cuota 3 de 6", monto: 180000 },
  { diasAtras: 2, cliente: "Constructora Norte SRL", concepto: "Honorarios regulados", monto: 650000 },
  { diasAtras: 4, cliente: "Julián Ríos", concepto: "Anticipo", monto: 120000 },
  { diasAtras: 5, cliente: "Lucía Castro", concepto: "Consulta", monto: 45000 },
  { diasAtras: 7, cliente: "Transportes del Valle SA", concepto: "Cuota 1 de 4", monto: 210000 },
  { diasAtras: 8, cliente: "Hernán Paz", concepto: "Anticipo", monto: 95000 },
  { diasAtras: 10, cliente: "Farmacia San Martín SRL", concepto: "Honorarios regulados", monto: 300000 },
  { diasAtras: 11, cliente: "Familia Aguirre", concepto: "Cuota 2 de 5", monto: 160000 },
  { diasAtras: 13, cliente: "Carolina Medina", concepto: "Saldo final", monto: 75000 },
  { diasAtras: 14, cliente: "Ricardo Sosa", concepto: "Cuota 1 de 3", monto: 140000 },
  { diasAtras: 16, cliente: "Agustina Romero", concepto: "Anticipo", monto: 85000 },
  { diasAtras: 18, cliente: "Paula Figueroa", concepto: "Consulta y carta documento", monto: 80000 },
];

export const ACUERDOS = [
  { expediente: "EXP-0142", cliente: "Marta Gómez", pactado: 1080000, cuotas: 6, cobrado: 540000, participacion: "Titular 60% · Dr. Salas 40%" },
  { expediente: "EXP-0128", cliente: "Julián Ríos", pactado: 600000, cuotas: 5, cobrado: 120000, participacion: "Dr. Salas 100%" },
  { expediente: "EXP-0151", cliente: "Familia Aguirre", pactado: 800000, cuotas: 5, cobrado: 320000, participacion: "Titular 50% · Dra. Cano 50%" },
  { expediente: "EXP-0160", cliente: "Lucía Castro", pactado: 270000, cuotas: 3, cobrado: 45000, participacion: "Dra. Molina 100%" },
  { expediente: "EXP-0163", cliente: "Constructora Norte SRL", pactado: 1950000, cuotas: 3, cobrado: 650000, participacion: "Titular 70% · Dr. Herrera 30%" },
  { expediente: "EXP-0167", cliente: "Hernán Paz", pactado: 380000, cuotas: 4, cobrado: 95000, participacion: "Dr. Herrera 100%" },
  { expediente: "EXP-0170", cliente: "Transportes del Valle SA", pactado: 840000, cuotas: 4, cobrado: 210000, participacion: "Dra. Ortiz 60% · Dr. Luna 40%" },
  { expediente: "EXP-0178", cliente: "Ricardo Sosa", pactado: 420000, cuotas: 3, cobrado: 140000, participacion: "Dra. Cano 100%" },
  { expediente: "EXP-0181", cliente: "Farmacia San Martín SRL", pactado: 900000, cuotas: 3, cobrado: 300000, participacion: "Titular 100%" },
  { expediente: "EXP-0185", cliente: "Agustina Romero", pactado: 510000, cuotas: 6, cobrado: 85000, participacion: "Dra. Molina 50% · Dr. Luna 50%" },
];

export function formatoPesos(monto) {
  return `$${monto.toLocaleString("es-AR")}`;
}
