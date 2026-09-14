using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

public class Documento
{
    public int Id { get; set; }

    [Required]
    public string NombreOriginal { get; set; } = string.Empty;

    public string NombreArchivoInterno { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Descripcion { get; set; }

    public DateTime FechaSubida { get; set; } = DateTime.UtcNow;

    public int ExpedienteId { get; set; }
    public Expediente? Expediente { get; set; }
}