using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LegalManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int? UsuarioActualId =>
        int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    private bool EsAdmin => User.IsInRole(Roles.Admin);

    // GET: api/Users  (solo Admin; para listar usuarios en un desplegable existe /api/Tareas/usuarios)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Id)
            .ToListAsync();
        return Ok(users.Select(UserDto.From));
    }

    // GET: api/Users/5  (Admin, o cada usuario su propio perfil)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        if (!EsAdmin && UsuarioActualId != id) return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        return Ok(UserDto.From(user));
    }

    // POST: api/Users
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        if (!Roles.EsValido(request.Role))
            return BadRequest(new { message = "Rol inválido" });

        var email = request.Email.Trim();
        var emailLower = email.ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == emailLower))
            return BadRequest(new { message = "Ya existe un usuario con ese email" });

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim(),
            PuedeEditarClientes = request.PuedeEditarClientes,
            PuedeEliminarClientes = request.PuedeEliminarClientes,
            PuedeEditarExpedientes = request.PuedeEditarExpedientes,
            PuedeEliminarExpedientes = request.PuedeEliminarExpedientes,
            PuedeEditarTareas = request.PuedeEditarTareas,
            PuedeEliminarTareas = request.PuedeEliminarTareas
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, UserDto.From(user));
    }

    // PUT: api/Users/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
    {
        if (id != request.Id) return BadRequest("El id de la ruta no coincide con el del body");

        var esUnoMismo = UsuarioActualId == id;
        if (!EsAdmin && !esUnoMismo) return Forbid();

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var email = request.Email.Trim();
        var emailLower = email.ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Id != id && u.Email.ToLower() == emailLower))
            return BadRequest(new { message = "Ya existe un usuario con ese email" });

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = email;
        user.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono.Trim();
        user.AvatarUrl = request.AvatarUrl;

        // Rol y permisos: solo un Admin, y nunca sobre su propia cuenta
        // (evita que alguien se dé permisos a sí mismo o que el Admin se degrade sin querer).
        if (EsAdmin && !esUnoMismo)
        {
            if (request.Role != null)
            {
                if (!Roles.EsValido(request.Role)) return BadRequest(new { message = "Rol inválido" });
                user.Role = request.Role;
            }
            user.PuedeEditarClientes = request.PuedeEditarClientes ?? user.PuedeEditarClientes;
            user.PuedeEliminarClientes = request.PuedeEliminarClientes ?? user.PuedeEliminarClientes;
            user.PuedeEditarExpedientes = request.PuedeEditarExpedientes ?? user.PuedeEditarExpedientes;
            user.PuedeEliminarExpedientes = request.PuedeEliminarExpedientes ?? user.PuedeEliminarExpedientes;
            user.PuedeEditarTareas = request.PuedeEditarTareas ?? user.PuedeEditarTareas;
            user.PuedeEliminarTareas = request.PuedeEliminarTareas ?? user.PuedeEliminarTareas;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/Users/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        if (UsuarioActualId == id)
            return BadRequest(new { message = "No podés eliminar tu propia cuenta" });

        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
