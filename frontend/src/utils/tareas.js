const MS_DIA = 1000 * 60 * 60 * 24;

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Días de calendario hasta el vencimiento (negativo = ya venció)
export function diasParaVencer(tarea) {
  return Math.round((inicioDelDia(tarea.fechaVencimiento) - inicioDelDia(new Date())) / MS_DIA);
}

// Estado que se muestra en toda la app: listado de tareas, panel, expediente y campanita
export function getEstadoTarea(tarea) {
  if (tarea.completada) return { clave: "completada", label: "Completada", clase: "badge-success", dot: "dot-success" };

  const dias = diasParaVencer(tarea);
  if (dias < 0) return { clave: "vencida", label: "Vencida", clase: "badge-danger", dot: "dot-danger" };
  if (dias <= 2) return { clave: "urgente", label: "Urgente", clase: "badge-danger", dot: "dot-danger" };
  if (dias <= 7) return { clave: "proxima", label: "Próxima", clase: "badge-warning", dot: "dot-warning" };
  return { clave: "pendiente", label: "Pendiente", clase: "badge-info", dot: "dot-info" };
}

export function iniciales(nombre, apellido) {
  return `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();
}
