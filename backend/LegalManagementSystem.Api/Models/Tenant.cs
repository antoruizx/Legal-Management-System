using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

public class Tenant
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre del estudio es obligatorio")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    // Identificador corto, por si más adelante se usa en una URL o subdominio
    [Required]
    [MaxLength(60)]
    public string Slug { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool Active { get; set; } = true;
}