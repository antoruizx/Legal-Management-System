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
            .Select(u => new { u.TenantId, u.Email, u.Role })
            .ToListAsync();

        var tenants = await _context.Tenants.OrderBy(t => t.Id).ToListAsync();

        return Ok(tenants.Select(t => new
        {
            t.Id,
            t.Name,
            t.Slug,
            t.CreatedAt,
            t.Active,
            Usuarios = usuarios.Count(u => u.TenantId == t.Id),
            AdminEmail = usuarios.FirstOrDefault(u => u.TenantId == t.Id && u.Role == Roles.Admin)?.Email
        }));
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
    // pero sí el código de invitación (Registro:Codigo; en producción, variable Registro__Codigo).
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterTenantRequest request)
    {
        var codigo = _configuration["Registro:Codigo"];
        if (string.IsNullOrWhiteSpace(codigo))
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "El registro de estudios no está habilitado" });

        if (!CodigoValido(request.InvitationCode, codigo))
            return BadRequest(new { message = "El código de invitación no es válido" });

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

        var tenant = new Tenant
        {
            Name = request.StudioName.Trim(),
            Slug = slug
        };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(); // necesitamos el Id generado antes de crear el usuario

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
            esSuperAdmin = _tokenService.EsSuperAdmin(admin),
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