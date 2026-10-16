using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

// Código de un solo uso que genera un vendedor para que un cliente registre su estudio
// con una prueba gratis. No pertenece a ningún estudio: no lleva TenantId ni filtro.
public class CodigoInvitacion
{
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Codigo { get; set; } = string.Empty;

    public int VendedorId { get; set; }

    public DateTime CreadoEl { get; set; } = DateTime.UtcNow;

    // Si no se usa antes de esta fecha, deja de servir
    public DateTime VenceEl { get; set; }

    public DateTime? UsadoEl { get; set; }

    // Estudio que se registró con este código
    public int? TenantId { get; set; }
}
