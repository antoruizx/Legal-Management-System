using System.ComponentModel.DataAnnotations;

namespace LegalManagementSystem.Api.Models;

// Contenido de un documento cuando se guardan en la base (Almacenamiento:Tipo = BaseDeDatos).
// No lleva TenantId: solo se llega a un archivo por el Documento, que ya está filtrado por estudio.
public class ArchivoGuardado
{
    [Key]
    [MaxLength(300)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(200)]
    public string TipoContenido { get; set; } = string.Empty;

    public byte[] Contenido { get; set; } = Array.Empty<byte>();
}
