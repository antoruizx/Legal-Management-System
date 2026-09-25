using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

public class Expediente
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El número de expediente es obligatorio")]
    [MaxLength(50)]
    public string Numero { get; set; } = string.Empty;

    [Required(ErrorMessage = "La carátula es obligatoria")]
    [MaxLength(300)]
    public string Caratula { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Estado { get; set; } = "Activo";

    public DateTime FechaInicio { get; set; } = DateTime.UtcNow;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public ICollection<Movimiento> Movimientos { get; set; } = new List<Movimiento>();
    public ICollection<Tarea> Tareas { get; set; } = new List<Tarea>();

    public ICollection<Documento> Documentos { get; set; } = new List<Documento>();
}