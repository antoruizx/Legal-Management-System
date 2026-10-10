using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
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
}

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;

    public TenantsController(ApplicationDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    // Alta de un estudio nuevo con su primer usuario Admin. Público: no requiere estar logueado.
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterTenantRequest request)
    {
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
            puedeEditarClientes = true,
            puedeEliminarClientes = true,
            puedeEditarExpedientes = true,
            puedeEliminarExpedientes = true,
            puedeEditarTareas = true,
            puedeEliminarTareas = true
        });
    }

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