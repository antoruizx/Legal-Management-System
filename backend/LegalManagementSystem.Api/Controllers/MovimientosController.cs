using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MovimientosController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MovimientosController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMovimientos()
    {
        var movimientos = await _context.Movimientos.ToListAsync();
        return Ok(movimientos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovimiento(int id)
    {
        var movimiento = await _context.Movimientos.FindAsync(id);
        if (movimiento == null) return NotFound();
        return Ok(movimiento);
    }

    [HttpPost]
    public async Task<IActionResult> CreateMovimiento(Movimiento movimiento)
    {
        var expedienteExiste = await _context.Expedientes.AnyAsync(e => e.Id == movimiento.ExpedienteId);
        if (!expedienteExiste) return BadRequest($"No existe un expediente con id {movimiento.ExpedienteId}");

        _context.Movimientos.Add(movimiento);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMovimiento), new { id = movimiento.Id }, movimiento);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMovimiento(int id, Movimiento movimiento)
    {
        if (id != movimiento.Id) return BadRequest("El id de la ruta no coincide con el del body");

        _context.Entry(movimiento).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Movimientos.Any(m => m.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

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