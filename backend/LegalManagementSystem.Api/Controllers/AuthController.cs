using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace LegalManagementSystem.Api.Controllers;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Channel { get; set; } = "email"; // email | sms | whatsapp
}

public class VerifyCodeRequest
{
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Code { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IMessageSender _sender;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ApplicationDbContext context,
        IConfiguration configuration,
        IMessageSender sender,
        IWebHostEnvironment env,
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _sender = sender;
        _env = env;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null || !VerificarPassword(user, request.Password))
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        // Si venía en texto plano, VerificarPassword ya la convirtió a hash: la guardamos
        await _context.SaveChangesAsync();

        var token = GenerarToken(user);

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

        user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return Ok(new { id = user.Id, email = user.Email });
    }

    // ---------- Restablecer contraseña ----------

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var channel = (request.Channel ?? "").Trim().ToLower();
        if (channel is not ("email" or "sms" or "whatsapp"))
            return BadRequest(new { message = "Canal inválido" });

        if (channel == "email" && string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Ingresá tu email" });

        if (channel != "email" && NormalizarTelefono(request.Phone) == null)
            return BadRequest(new { message = "Ingresá un número de teléfono válido, con código de país" });

        // Siempre la misma respuesta, exista o no el usuario (no revelamos qué datos están registrados)
        var respuesta = Ok(new { message = "Si los datos son correctos, te enviamos un código." });

        // Email: se busca por email. SMS/WhatsApp: se busca por el teléfono guardado.
        var user = channel == "email"
            ? await BuscarUsuarioAsync(request.Email, null)
            : await BuscarUsuarioAsync(null, request.Phone);
        if (user == null) return respuesta;

        // Máximo un código por minuto
        var ultimo = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();
        if (ultimo != null && ultimo.CreatedAt > DateTime.UtcNow.AddSeconds(-60))
            return respuesta;

        // El código va SIEMPRE al teléfono guardado del usuario, no al que escribió quien lo pide
        string? telefonoDestino = null;
        if (channel != "email")
        {
            telefonoDestino = NormalizarTelefono(user.Telefono);
            if (telefonoDestino == null) return respuesta;
        }

        // Invalida los códigos anteriores
        var anteriores = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id && !c.Used)
            .ToListAsync();
        foreach (var c in anteriores) c.Used = true;

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        _context.PasswordResetCodes.Add(new PasswordResetCode
        {
            UserId = user.Id,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(code),
            Channel = channel,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        await _context.SaveChangesAsync();

        // Solo en desarrollo: muestra el código en la consola para probar sin proveedores
        if (_env.IsDevelopment())
            _logger.LogInformation("Código de recuperación para {Email}: {Code}", user.Email, code);

        var texto = $"Tu código para restablecer la contraseña de Legal Management System es {code}. Vence en 10 minutos. Si no lo pediste, ignorá este mensaje.";

        try
        {
            switch (channel)
            {
                case "email":
                    await _sender.SendEmailAsync(user.Email, "Tu código de recuperación", HtmlMail(user.FirstName, code));
                    break;
                case "sms":
                    await _sender.SendSmsAsync(telefonoDestino!, texto);
                    break;
                case "whatsapp":
                    await _sender.SendWhatsAppAsync(telefonoDestino!, texto);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falló el envío del código de recuperación");
        }

        return respuesta;
    }

    // Comprueba que el código sea válido (sin consumirlo)
    [HttpPost("verify-reset-code")]
    public async Task<IActionResult> VerifyResetCode(VerifyCodeRequest request)
    {
        var (_, registro) = await ValidarCodigoAsync(request.Email, request.Phone, request.Code);
        if (registro == null)
            return BadRequest(new { message = "Código incorrecto o vencido" });

        return Ok(new { valid = true });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            return BadRequest(new { message = "La contraseña debe tener al menos 8 caracteres" });

        var (user, registro) = await ValidarCodigoAsync(request.Email, request.Phone, request.Code);
        if (user == null || registro == null)
            return BadRequest(new { message = "Código incorrecto o vencido" });

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        registro.Used = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contraseña actualizada. Ya podés iniciar sesión." });
    }

    // ---------- Helpers ----------

    private async Task<User?> BuscarUsuarioAsync(string? email, string? phone)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            var mail = email.Trim().ToLower();
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == mail);
        }

        var buscado = NormalizarParaComparar(phone);
        if (buscado == null) return null;

        // Pocos usuarios: comparamos en memoria para tolerar distintos formatos guardados
        var candidatos = await _context.Users.Where(u => u.Telefono != null).ToListAsync();
        return candidatos.FirstOrDefault(u => NormalizarParaComparar(u.Telefono) == buscado);
    }

    private async Task<(User? user, PasswordResetCode? registro)> ValidarCodigoAsync(string? email, string? phone, string? code)
    {
        var user = await BuscarUsuarioAsync(email, phone);
        if (user == null) return (null, null);

        var registro = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id && !c.Used && c.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (registro == null || registro.Attempts >= 5) return (user, null);

        if (!BCrypt.Net.BCrypt.Verify(code ?? "", registro.CodeHash))
        {
            registro.Attempts++;
            await _context.SaveChangesAsync();
            return (user, null);
        }

        return (user, registro);
    }

    // Acepta contraseñas con hash y, por compatibilidad, las que todavía están en texto plano
    private static bool VerificarPassword(User user, string plano)
    {
        if (user.Password.StartsWith("$2"))
            return BCrypt.Net.BCrypt.Verify(plano, user.Password);

        if (user.Password == plano)
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(plano);
            return true;
        }

        return false;
    }

    // Formato internacional: "+54 9 381 123-4567" -> "+5493811234567"
    private static string? NormalizarTelefono(string? tel)
    {
        if (string.IsNullOrWhiteSpace(tel)) return null;
        var limpio = new string(tel.Where(c => char.IsDigit(c) || c == '+').ToArray());
        return limpio.StartsWith("+") && limpio.Length >= 10 ? limpio : null;
    }

    // Para comparar: en celulares argentinos ignora el 9 (+549... == +54...)
    private static string? NormalizarParaComparar(string? tel)
    {
        var t = NormalizarTelefono(tel);
        if (t == null) return null;
        return t.StartsWith("+549") ? "+54" + t[4..] : t;
    }

    private static string HtmlMail(string nombre, string code) => $@"
<div style=""font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px"">
  <h2 style=""margin:0 0 8px"">Hola {nombre},</h2>
  <p>Usá este código para restablecer tu contraseña en Legal Management System:</p>
  <p style=""font-size:32px;letter-spacing:8px;font-weight:bold;margin:20px 0"">{code}</p>
  <p style=""color:#666"">Vence en 10 minutos. Si no lo pediste vos, ignorá este mensaje.</p>
</div>";

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