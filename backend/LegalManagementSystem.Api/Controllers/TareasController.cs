using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TareasController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TareasController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTareas()
    {
        var tareas = await _context.Tareas
            .Include(t => t.Expediente)
            .Include(t => t.User)
            .ToListAsync();
        return Ok(tareas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTarea(int id)
    {
        var tarea = await _context.Tareas
            .Include(t => t.Expediente)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (tarea == null) return NotFound();
        return Ok(tarea);
    }

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        var usuarios = await _context.Users
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.Role })
            .ToListAsync();
        return Ok(usuarios);
    }

    // POST: api/Tareas?actorUserId=3
    [HttpPost]
    public async Task<IActionResult> CreateTarea(Tarea tarea, [FromQuery] int actorUserId)
    {
        var expediente = await _context.Expedientes.FindAsync(tarea.ExpedienteId);
        if (expediente == null) return BadRequest($"No existe un expediente con id {tarea.ExpedienteId}");

        var userExiste = await _context.Users.AnyAsync(u => u.Id == tarea.UserId);
        if (!userExiste) return BadRequest($"No existe un usuario responsable con id {tarea.UserId}");

        var actorExiste = await _context.Users.AnyAsync(u => u.Id == actorUserId);
        if (!actorExiste) return BadRequest($"No existe un usuario con id {actorUserId}");

        _context.Tareas.Add(tarea);
        await _context.SaveChangesAsync();

        // Movimiento automático en el expediente al que pertenece la tarea
        var movimiento = new Movimiento
        {
            ExpedienteId = tarea.ExpedienteId,
            UserId = actorUserId,
            Tipo = "Tarea",
            Descripcion = $"Se creó la tarea \"{tarea.Titulo}\".",
            Fecha = DateTime.UtcNow
        };
        _context.Movimientos.Add(movimiento);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTarea), new { id = tarea.Id }, tarea);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTarea(int id, Tarea tarea)
    {
        if (id != tarea.Id) return BadRequest("El id de la ruta no coincide con el del body");

        _context.Entry(tarea).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Tareas.Any(t => t.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTarea(int id)
    {
        var tarea = await _context.Tareas.FindAsync(id);
        if (tarea == null) return NotFound();

        _context.Tareas.Remove(tarea);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}