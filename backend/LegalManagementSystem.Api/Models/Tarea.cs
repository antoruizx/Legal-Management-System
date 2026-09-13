namespace LegalManagementSystem.Api.Models;

public class Tarea
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaVencimiento { get; set; }
    public bool Completada { get; set; } = false;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // FK a Expediente
    public int ExpedienteId { get; set; }
    public Expediente? Expediente { get; set; }

    // FK a User (responsable)
    public int UserId { get; set; }
    public User? User { get; set; }
}