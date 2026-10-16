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

    // Fin de la prueba gratis. null = cliente pago (o estudio sin prueba): no vence.
    public DateTime? PruebaHasta { get; set; }

    // Vendedor que trajo al estudio (usuario con EsVendedor), si se registró con su código
    public int? VendedorId { get; set; }

    // Mails automáticos de la prueba (AvisosDePruebaService): cuándo se mandó cada uno, para no repetirlos.
    // Se vuelven a null al extender la prueba.
    public DateTime? AvisoPorVencerEnviado { get; set; }
    public DateTime? AvisoVencidoEnviado { get; set; }

    public const int DiasDePrueba = 7;
    public const int DiasAvisoPorVencer = 2;
}