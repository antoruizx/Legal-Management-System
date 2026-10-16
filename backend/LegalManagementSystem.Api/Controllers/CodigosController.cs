using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

namespace LegalManagementSystem.Api.Controllers;

// Códigos de invitación de un solo uso: cada vendedor genera los suyos y se los pasa a un
// cliente, que se registra con una prueba gratis (ver TenantsController.Register).
// El superadmin ve los de todos los vendedores.
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Vendedor")]
public class CodigosController : ControllerBase
{
    private const int DiasValidez = 30;
    // Sin letras ni números que se confundan al dictarlos (O/0, I/1/L)
    private const string Alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    private readonly ApplicationDbContext _context;

    public CodigosController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int UsuarioActualId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool EsSuperAdmin => User.HasClaim("superAdmin", "true");

    // GET: api/Codigos
    [HttpGet]
    public async Task<IActionResult> GetCodigos()
    {
        var query = _context.CodigosInvitacion.AsQueryable();
        if (!EsSuperAdmin)
            query = query.Where(c => c.VendedorId == UsuarioActualId);

        var codigos = await query.OrderByDescending(c => c.CreadoEl).ToListAsync();

        // Los vendedores y los estudios son de otros tenants: hace falta IgnoreQueryFilters
        var idsVendedores = codigos.Select(c => c.VendedorId).Distinct().ToList();
        var vendedores = await _context.Users.IgnoreQueryFilters()
            .Where(u => idsVendedores.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}");

        var idsTenants = codigos.Where(c => c.TenantId != null).Select(c => c.TenantId!.Value).ToList();
        var tenants = await _context.Tenants
            .Where(t => idsTenants.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id);

        return Ok(codigos.Select(c =>
        {
            Tenant? estudio = c.TenantId != null && tenants.TryGetValue(c.TenantId.Value, out var t) ? t : null;
            return new
            {
                c.Id,
                c.Codigo,
                c.CreadoEl,
                c.VenceEl,
                c.UsadoEl,
                Vendedor = vendedores.GetValueOrDefault(c.VendedorId),
                Estudio = estudio == null ? null : new { estudio.Id, estudio.Name, estudio.PruebaHasta, estudio.Active }
            };
        }));
    }

    // POST: api/Codigos
    [HttpPost]
    public async Task<IActionResult> CrearCodigo()
    {
        string codigo;
        do
        {
            codigo = "FOJA-" + new string(Enumerable.Range(0, 6)
                .Select(_ => Alfabeto[RandomNumberGenerator.GetInt32(Alfabeto.Length)])
                .ToArray());
        } while (await _context.CodigosInvitacion.AnyAsync(c => c.Codigo == codigo));

        var nuevo = new CodigoInvitacion
        {
            Codigo = codigo,
            VendedorId = UsuarioActualId,
            VenceEl = DateTime.UtcNow.AddDays(DiasValidez)
        };
        _context.CodigosInvitacion.Add(nuevo);
        await _context.SaveChangesAsync();

        return Ok(new { nuevo.Id, nuevo.Codigo, nuevo.CreadoEl, nuevo.VenceEl });
    }

    // DELETE: api/Codigos/5  (solo si todavía no se usó)
    [HttpDelete("{id}")]
    public async Task<IActionResult> AnularCodigo(int id)
    {
        var codigo = await _context.CodigosInvitacion.FindAsync(id);
        if (codigo == null || (!EsSuperAdmin && codigo.VendedorId != UsuarioActualId)) return NotFound();
        if (codigo.UsadoEl != null)
            return BadRequest(new { message = "Ese código ya se usó para registrar un estudio" });

        _context.CodigosInvitacion.Remove(codigo);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
