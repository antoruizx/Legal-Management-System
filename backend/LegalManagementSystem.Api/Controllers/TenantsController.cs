using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace LegalManagementSystem.Api.Controllers;

public class RegisterTenantRequest
{
    public string StudioName { get; set; } = string.Empty;
    public string AdminFirstName { get; set; } = string.Empty;
    public string AdminLastName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPassword { get; set; } = string.Empty;
    public string InvitationCode { get; set; } = string.Empty;
}

public class SetTenantActiveRequest
{
    public bool Active { get; set; }
}

public class ExtenderPruebaRequest
{
    public int Dias { get; set; } = Tenant.DiasDePrueba;
}

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;

    public TenantsController(ApplicationDbContext context, ITokenService tokenService, IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    // ---------- Panel de estudios (solo superadmin) ----------

    // GET: api/Tenants
    [HttpGet]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> GetTenants()
    {
        // El superadmin también pertenece a un estudio: sin IgnoreQueryFilters solo vería sus propios usuarios
        var usuarios = await _context.Users.IgnoreQueryFilters()
            .OrderBy(u => u.Id)
            .Select(u => new { u.Id, u.TenantId, u.Email, u.Role, u.FirstName, u.LastName, u.EsVendedor })
            .ToListAsync();

        var tenants = await _context.Tenants.OrderBy(t => t.Id).ToListAsync();

        return Ok(tenants.Select(t =>
        {
            var vendedor = usuarios.FirstOrDefault(u => u.Id == t.VendedorId);
            return new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.CreatedAt,
                t.Active,
                t.PruebaHasta,
                Vendedor = vendedor == null ? null : $"{vendedor.FirstName} {vendedor.LastName}",
                // Estudio de demostración de un vendedor (no es un cliente)
                EsDeVendedor = usuarios.Any(u => u.TenantId == t.Id && u.EsVendedor),
                Usuarios = usuarios.Count(u => u.TenantId == t.Id),
                AdminEmail = usuarios.FirstOrDefault(u => u.TenantId == t.Id && u.Role == Roles.Admin)?.Email
            };
        }));
    }

    // PUT: api/Tenants/5/extender-prueba  (suma días desde hoy o desde el fin actual, lo que sea más tarde)
    [HttpPut("{id}/extender-prueba")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> ExtenderPrueba(int id, ExtenderPruebaRequest request)
    {
        if (request.Dias < 1 || request.Dias > 365)
            return BadRequest(new { message = "Elegí entre 1 y 365 días" });

        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        var desde = tenant.PruebaHasta > DateTime.UtcNow ? tenant.PruebaHasta.Value : DateTime.UtcNow;
        tenant.PruebaHasta = desde.AddDays(request.Dias);
        await _context.SaveChangesAsync();
        return Ok(new { tenant.PruebaHasta });
    }

    // PUT: api/Tenants/5/activar-pago  (deja de ser prueba: ya no vence)
    [HttpPut("{id}/activar-pago")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> ActivarPago(int id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        tenant.PruebaHasta = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/Tenants/5/active
    [HttpPut("{id}/active")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> SetActive(int id, SetTenantActiveRequest request)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        if (!request.Active && User.FindFirst("tenantId")?.Value == id.ToString())
            return BadRequest(new { message = "No podés desactivar tu propio estudio" });

        tenant.Active = request.Active;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Alta de estudio ----------

    // Alta de un estudio nuevo con su primer usuario Admin. Público: no requiere estar logueado,
    // pero sí un código de invitación: uno de un solo uso generado por un vendedor (CodigosController)
    // o el código general Registro:Codigo (en producción, variable Registro__Codigo).
    // Todo estudio nuevo arranca con Tenant.DiasDePrueba días de prueba; el superadmin lo pasa a pago.
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterTenantRequest request)
    {
        var codigoIngresado = (request.InvitationCode ?? "").Trim().ToUpperInvariant();
        var ahora = DateTime.UtcNow;

        var codigoVendedor = await _context.CodigosInvitacion
            .FirstOrDefaultAsync(c => c.Codigo == codigoIngresado && c.UsadoEl == null && c.VenceEl > ahora);

        var codigoGeneral = _configuration["Registro:Codigo"];
        var esCodigoGeneral = codigoVendedor == null
            && !string.IsNullOrWhiteSpace(codigoGeneral)
            && CodigoValido(request.InvitationCode, codigoGeneral);

        if (codigoVendedor == null && !esCodigoGeneral)
            return BadRequest(new { message = "El código de invitación no es válido o ya fue usado" });

        if (string.IsNullOrWhiteSpace(request.StudioName))
            return BadRequest(new { message = "El nombre del estudio es obligatorio" });

        if (string.IsNullOrWhiteSpace(request.AdminEmail) || string.IsNullOrWhiteSpace(request.AdminPassword))
            return BadRequest(new { message = "Email y contraseña son obligatorios" });

        if (request.AdminPassword.Length < 8)
            return BadRequest(new { message = "La contraseña debe tener al menos 8 caracteres" });

        var email = request.AdminEmail.Trim().ToLowerInvariant();

        // Nadie logueado todavía: busca en todos los estudios (el email es único en toda la app)
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
            return BadRequest(new { message = "Ya existe una cuenta con ese email" });

        var slugBase = GenerarSlug(request.StudioName);
        var slug = slugBase;
        var sufijo = 1;
        while (await _context.Tenants.AnyAsync(t => t.Slug == slug))
            slug = $"{slugBase}-{++sufijo}";

        // Se "toma" el código recién ahora, con todos los datos validados (si no, un error de tipeo
        // en el email lo quemaría). El UPDATE condicional evita que dos registros usen el mismo código.
        if (codigoVendedor != null)
        {
            var tomado = await _context.CodigosInvitacion
                .Where(c => c.Id == codigoVendedor.Id && c.UsadoEl == null)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.UsadoEl, ahora));
            if (tomado == 0)
                return BadRequest(new { message = "El código de invitación no es válido o ya fue usado" });
        }

        // El estudio del dueño de Foja (email en SuperAdmin:Emails) no tiene prueba que venza
        var esDelSuperAdmin = _tokenService.EsSuperAdmin(new User { Email = email });

        var tenant = new Tenant
        {
            Name = request.StudioName.Trim(),
            Slug = slug,
            PruebaHasta = esDelSuperAdmin ? null : ahora.AddDays(Tenant.DiasDePrueba),
            VendedorId = codigoVendedor?.VendedorId
        };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(); // necesitamos el Id generado antes de crear el usuario

        if (codigoVendedor != null)
        {
            await _context.CodigosInvitacion
                .Where(c => c.Id == codigoVendedor.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.TenantId, tenant.Id));
        }

        var admin = new User
        {
            FirstName = request.AdminFirstName.Trim(),
            LastName = request.AdminLastName.Trim(),
            Email = request.AdminEmail.Trim(),
            Password = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
            Role = Roles.Admin,
            TenantId = tenant.Id, // nadie logueado: no se autoasigna solo, lo ponemos a mano
            PuedeEditarClientes = true,
            PuedeEliminarClientes = true,
            PuedeEditarExpedientes = true,
            PuedeEliminarExpedientes = true,
            PuedeEditarTareas = true,
            PuedeEliminarTareas = true
        };
        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerarToken(admin);

        return Ok(new
        {
            token,
            id = admin.Id,
            firstName = admin.FirstName,
            lastName = admin.LastName,
            email = admin.Email,
            role = admin.Role,
            tenantId = tenant.Id,
            tenantName = tenant.Name,
            pruebaHasta = tenant.PruebaHasta,
            esSuperAdmin = _tokenService.EsSuperAdmin(admin),
            esVendedor = false,
            puedeEditarClientes = true,
            puedeEliminarClientes = true,
            puedeEditarExpedientes = true,
            puedeEliminarExpedientes = true,
            puedeEditarTareas = true,
            puedeEliminarTareas = true
        });
    }

    // Comparación en tiempo constante: no deja adivinar el código midiendo cuánto tarda la respuesta
    private static bool CodigoValido(string? recibido, string esperado) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes((recibido ?? "").Trim()),
            Encoding.UTF8.GetBytes(esperado.Trim()));

    private static string GenerarSlug(string nombre)
    {
        var normalizado = nombre.Trim().ToLowerInvariant();
        var sinAcentos = new string(normalizado
            .Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray());
        var limpio = Regex.Replace(sinAcentos, "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(limpio) ? "estudio" : limpio;
    }
}