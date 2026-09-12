namespace LegalManagementSystem.Api.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string? DNI { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public DateTime FechaAlta { get; set; } = DateTime.UtcNow;

    public ICollection<Expediente> Expedientes { get; set; } = new List<Expediente>();
}