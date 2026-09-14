using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Controllers;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuthController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Password == request.Password);

        if (user == null)
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        // No devolvemos el Password
        return Ok(new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            role = user.Role
        });
    }

        [HttpPost("register")]
    public async Task<IActionResult> Register(User user)
    {
        var existe = await _context.Users.AnyAsync(u => u.Email == user.Email);
        if (existe) return BadRequest("Ya existe un usuario con ese email");

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return Ok(new { id = user.Id, email = user.Email });
    }
}