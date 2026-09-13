namespace LegalManagementSystem.Api.Models;

public class Movimiento
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty; // ej: "Presentación", "Resolución", "Notificación"
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    // FK a Expediente
    public int ExpedienteId { get; set; }
    public Expediente? Expediente { get; set; }
}