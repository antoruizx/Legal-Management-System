using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

public class Tarea
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La fecha de vencimiento es obligatoria")]
    public DateTime FechaVencimiento { get; set; }

    public bool Completada { get; set; } = false;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public int ExpedienteId { get; set; }
    public Expediente? Expediente { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }
}