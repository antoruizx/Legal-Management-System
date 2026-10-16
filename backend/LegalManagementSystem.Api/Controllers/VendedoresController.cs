using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Controllers;

public class CrearVendedorRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// Alta de vendedores (solo superadmin). Cada vendedor tiene su propio estudio de demostración,
// vacío y aislado: así puede mostrar el sistema sin ver datos de ningún cliente.
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdmin")]
public class VendedoresController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VendedoresController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Vendedores
    [HttpGet]
    public async Task<IActionResult> GetVendedores()
    {
        var vendedores = await _context.Users.IgnoreQueryFilters()
            .Where(u => u.EsVendedor)
            .OrderBy(u => u.FirstName)
            .ToListAsync();

        var ids = vendedores.Select(v => v.Id).ToList();
        var codigos = await _context.CodigosInvitacion.Where(c => ids.Contains(c.VendedorId)).ToListAsync();
        var estudios = await _context.Tenants.Where(t => t.VendedorId != null && ids.Contains(t.VendedorId.Value)).ToListAsync();

        return Ok(vendedores.Select(v => new
        {
            v.Id,
            v.FirstName,
            v.LastName,
            v.Email,
            CodigosGenerados = codigos.Count(c => c.VendedorId == v.Id),
            EstudiosEnPrueba = estudios.Count(t => t.VendedorId == v.Id && t.PruebaHasta != null),
            EstudiosPagos = estudios.Count(t => t.VendedorId == v.Id && t.PruebaHasta == null)
        }));
    }

    // POST: api/Vendedores
    [HttpPost]
    public async Task<IActionResult> CrearVendedor(CrearVendedorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { message = "Nombre y apellido son obligatorios" });

        if (string.IsNullOrWhiteSpace(request.Email) || request.Password.Length < 8)
            return BadRequest(new { message = "Ingresá un email y una contraseña de al menos 8 caracteres" });

        var email = request.Email.Trim();
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == email.ToLowerInvariant()))
            return BadRequest(new { message = "Ya existe una cuenta con ese email" });

        await using var transaccion = await _context.Database.BeginTransactionAsync();

        var nombre = $"{request.FirstName.Trim()} {request.LastName.Trim()}";
        var tenant = new Tenant
        {
            Name = $"Demo de {nombre}",
            Slug = $"demo-vendedor-{Guid.NewGuid():N}"[..30]
        };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        var vendedor = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = Roles.Admin,
            EsVendedor = true,
            PuedeEditarClientes = true,
            PuedeEliminarClientes = true,
            PuedeEditarExpedientes = true,
            PuedeEliminarExpedientes = true,
            PuedeEditarTareas = true,
            PuedeEliminarTareas = true
        };
        _context.Users.Add(vendedor);
        await _context.SaveChangesAsync();

        // SaveChanges le asigna siempre el estudio de quien está logueado (el del superadmin):
        // se lo mueve a su estudio de demostración con un UPDATE directo, que no pasa por ese paso.
        await _context.Users.IgnoreQueryFilters()
            .Where(u => u.Id == vendedor.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.TenantId, tenant.Id));

        await transaccion.CommitAsync();

        return Ok(new { vendedor.Id, vendedor.Email, estudio = tenant.Name });
    }
}
