using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpedientesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExpedientesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Expedientes
    [HttpGet]
    public async Task<IActionResult> GetExpedientes()
    {
        var expedientes = await _context.Expedientes
            .Include(e => e.Cliente)
            .ToListAsync();
        return Ok(expedientes);
    }

    // GET: api/Expedientes/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpediente(int id)
    {
        var expediente = await _context.Expedientes
            .Include(e => e.Cliente)
            .Include(e => e.Movimientos)
            .Include(e => e.Tareas)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (expediente == null) return NotFound();
        return Ok(expediente);
    }

    // POST: api/Expedientes?actorUserId=3
    [HttpPost]
    public async Task<IActionResult> CreateExpediente(Expediente expediente, [FromQuery] int actorUserId)
    {
        var cliente = await _context.Clientes.FindAsync(expediente.ClienteId);
        if (cliente == null) return BadRequest($"No existe un cliente con id {expediente.ClienteId}");

        var actorExiste = await _context.Users.AnyAsync(u => u.Id == actorUserId);
        if (!actorExiste) return BadRequest($"No existe un usuario con id {actorUserId}");

          expediente.FechaCreacion = DateTime.UtcNow;

        _context.Expedientes.Add(expediente);
        await _context.SaveChangesAsync();
        
        // Movimiento automático: creación + asignación de cliente, en un solo evento
        var movimiento = new Movimiento
        {
            ExpedienteId = expediente.Id,
            UserId = actorUserId,
            Tipo = "Creación",
            Descripcion = $"Expediente creado y asignado a {cliente.Nombre} {cliente.Apellido}.",
            Fecha = DateTime.UtcNow
        };
        _context.Movimientos.Add(movimiento);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetExpediente), new { id = expediente.Id }, expediente);
    }

    // PUT: api/Expedientes/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpediente(int id, Expediente expediente)
    {
        if (id != expediente.Id) return BadRequest("El id de la ruta no coincide con el del body");

        _context.Entry(expediente).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Expedientes.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    // DELETE: api/Expedientes/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpediente(int id)
    {
        var expediente = await _context.Expedientes.FindAsync(id);
        if (expediente == null) return NotFound();

        _context.Expedientes.Remove(expediente);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}