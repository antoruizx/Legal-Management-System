using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

public class Cliente
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [MaxLength(100)]
    public string Apellido { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? DNI { get; set; }

    [EmailAddress(ErrorMessage = "El formato de email no es válido")]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Telefono { get; set; }

    public DateTime FechaAlta { get; set; } = DateTime.UtcNow;

    public ICollection<Expediente> Expedientes { get; set; } = new List<Expediente>();
}