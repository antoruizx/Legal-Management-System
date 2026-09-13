using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

public class Movimiento
{
    public int Id { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria")]
    [MaxLength(500)]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de movimiento es obligatorio")]
    [MaxLength(50)]
    public string Tipo { get; set; } = string.Empty;

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public int ExpedienteId { get; set; }
    public Expediente? Expediente { get; set; }
}