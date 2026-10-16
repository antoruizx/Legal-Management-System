const MS_DIA = 1000 * 60 * 60 * 24;

// Días que le quedan a una prueba gratis (0 si vence hoy, negativo si ya venció)
export function diasDePrueba(pruebaHasta) {
  return Math.ceil((new Date(pruebaHasta) - new Date()) / MS_DIA);
}

// Etiqueta del estado comercial de un estudio, para el panel de Estudios y los códigos
export function estadoComercial(estudio) {
  if (!estudio.pruebaHasta) return { label: "Pago", clase: "badge-success" };
  const dias = diasDePrueba(estudio.pruebaHasta);
  if (dias <= 0) return { label: "Prueba vencida", clase: "badge-danger" };
  return { label: `Prueba: ${dias} ${dias === 1 ? "día" : "días"}`, clase: dias <= 2 ? "badge-warning" : "badge-info" };
}
