using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

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
    private readonly IConfiguration _configuration;

    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Password == request.Password);

        if (user == null)
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        var token = GenerarToken(user);

        // No devolvemos el Password
        return Ok(new
        {
            token,
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            role = user.Role,
            telefono = user.Telefono,
            avatarUrl = user.AvatarUrl,
            puedeEditarClientes = user.PuedeEditarClientes,
            puedeEliminarClientes = user.PuedeEliminarClientes,
            puedeEditarExpedientes = user.PuedeEditarExpedientes,
            puedeEliminarExpedientes = user.PuedeEliminarExpedientes,
            puedeEditarTareas = user.PuedeEditarTareas,
            puedeEliminarTareas = user.PuedeEliminarTareas
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

    private string GenerarToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var jwtIssuer = _configuration["Jwt:Issuer"]!;
        var jwtAudience = _configuration["Jwt:Audience"]!;
        var horas = double.Parse(_configuration["Jwt:ExpiraEnHoras"] ?? "8");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(horas),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}