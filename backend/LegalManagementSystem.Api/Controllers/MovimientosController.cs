using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace LegalManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MovimientosController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MovimientosController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Movimientos?expedienteId=5&desde=2026-09-01&hasta=2026-09-24
    [HttpGet]
    public async Task<IActionResult> GetMovimientos(
        [FromQuery] int? expedienteId,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var query = _context.Movimientos.Include(m => m.User).AsQueryable();

        if (expedienteId.HasValue)
            query = query.Where(m => m.ExpedienteId == expedienteId.Value);

        if (desde.HasValue)
            query = query.Where(m => m.Fecha >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(m => m.Fecha <= hasta.Value.Date.AddDays(1).AddTicks(-1));

        var movimientos = await query.OrderByDescending(m => m.Fecha).ToListAsync();
        return Ok(movimientos);
    }

    // POST: api/Movimientos
    [HttpPost]
    public async Task<IActionResult> CreateMovimiento(Movimiento movimiento)
    {
        var expedienteExiste = await _context.Expedientes.AnyAsync(e => e.Id == movimiento.ExpedienteId);
        if (!expedienteExiste) return BadRequest($"No existe un expediente con id {movimiento.ExpedienteId}");

        var usuarioExiste = await _context.Users.AnyAsync(u => u.Id == movimiento.UserId);
        if (!usuarioExiste) return BadRequest($"No existe un usuario con id {movimiento.UserId}");

        movimiento.Fecha = DateTime.UtcNow;

        _context.Movimientos.Add(movimiento);
        await _context.SaveChangesAsync();

        // Recargamos con el User incluido para devolverlo completo al frontend
        await _context.Entry(movimiento).Reference(m => m.User).LoadAsync();

        return CreatedAtAction(nameof(GetMovimientos), new { expedienteId = movimiento.ExpedienteId }, movimiento);
    }

    // DELETE: api/Movimientos/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMovimiento(int id)
    {
        var movimiento = await _context.Movimientos.FindAsync(id);
        if (movimiento == null) return NotFound();

        _context.Movimientos.Remove(movimiento);
        await _context.SaveChangesAsync();
        return NoContent();
    }

}