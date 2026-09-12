namespace LegalManagementSystem.Api.Models;

public class Expediente
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Caratula { get; set; } = string.Empty;
    public string Estado { get; set; } = "Activo";
    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;

    // Relación con Cliente
    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }
}