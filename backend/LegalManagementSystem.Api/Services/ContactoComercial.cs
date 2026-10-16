using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Services;

// A quién contacta un estudio en prueba para contratar o hacer consultas: el vendedor que lo trajo
// o, si se registró sin vendedor, el contacto general (Contacto:Nombre / Contacto:WhatsApp / Contacto:Email).
// Los links de WhatsApp se arman acá para que los mails y el login usen los mismos mensajes.
public record Contacto(string Nombre, string? Email, string? Whatsapp, string? LinkContratar, string? LinkDudas);

public class ContactoComercial
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public ContactoComercial(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<Contacto> ParaEstudioAsync(Tenant tenant)
    {
        User? vendedor = null;
        if (tenant.VendedorId != null)
            vendedor = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == tenant.VendedorId);

        var nombre = vendedor != null ? $"{vendedor.FirstName} {vendedor.LastName}" : _config["Contacto:Nombre"] ?? "Foja";
        var email = vendedor != null ? vendedor.Email : _config["Contacto:Email"];
        var whatsapp = SoloDigitos(vendedor?.Telefono) ?? SoloDigitos(_config["Contacto:WhatsApp"]);

        if (whatsapp == null)
            return new Contacto(nombre, email, null, null, null);

        return new Contacto(
            nombre,
            email,
            whatsapp,
            LinkWhatsapp(whatsapp, $"¡Hola! Soy de {tenant.Name}. Me interesa contratar el servicio."),
            LinkWhatsapp(whatsapp, $"¡Hola! Soy de {tenant.Name}. Tengo algunas dudas, ¿me podrías asesorar más?"));
    }

    // wa.me necesita el número completo con código de país, solo dígitos (ej. 5493814988682)
    public static string? SoloDigitos(string? telefono)
    {
        if (string.IsNullOrWhiteSpace(telefono)) return null;
        var digitos = new string(telefono.Where(char.IsDigit).ToArray());
        return digitos.Length >= 10 ? digitos : null;
    }

    private static string LinkWhatsapp(string numero, string texto) =>
        $"https://wa.me/{numero}?text={Uri.EscapeDataString(texto)}";
}
