using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;

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

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
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
    private readonly IMessageSender _sender;
    private readonly ITokenService _tokenService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AuthController> _logger;
    private readonly ContactoComercial _contactos;

    public AuthController(
        ApplicationDbContext context,
        IMessageSender sender,
        ITokenService tokenService,
        IWebHostEnvironment env,
        ILogger<AuthController> logger,
        ContactoComercial contactos)
    {
        _context = context;
        _sender = sender;
        _tokenService = tokenService;
        _env = env;
        _logger = logger;
        _contactos = contactos;
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrEmpty(request.Password))
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        var email = request.Email.Trim().ToLowerInvariant();
        // Nadie está logueado todavía: el filtro de tenant está desactivado, busca en todos los estudios
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user == null || !VerificarPassword(user, request.Password))
            return Unauthorized(new { message = "Email o contraseña incorrectos" });

        await _context.SaveChangesAsync();

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId);
        // Se chequea después de validar la contraseña: así no revela nada a quien no es del estudio
        if (tenant == null || !tenant.Active)
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Tu estudio está desactivado. Contactá al soporte." });

        // Con la contraseña ya validada se le muestra cómo contactar a su asesor para contratar
        if (tenant.PruebaHasta != null && tenant.PruebaHasta < DateTime.UtcNow)
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Tu período de prueba de Foja terminó. Tus datos están guardados: contactá a tu asesor para seguir usando el sistema.",
                codigo = "PRUEBA_VENCIDA",
                estudio = tenant.Name,
                contacto = await _contactos.ParaEstudioAsync(tenant)
            });

        var token = _tokenService.GenerarToken(user);

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
            tenantId = user.TenantId,
            tenantName = tenant.Name,
            pruebaHasta = tenant.PruebaHasta,
            esSuperAdmin = _tokenService.EsSuperAdmin(user),
            esVendedor = user.EsVendedor,
            puedeEditarClientes = user.PuedeEditarClientes,
            puedeEliminarClientes = user.PuedeEliminarClientes,
            puedeEditarExpedientes = user.PuedeEditarExpedientes,
            puedeEliminarExpedientes = user.PuedeEliminarExpedientes,
            puedeEditarTareas = user.PuedeEditarTareas,
            puedeEliminarTareas = user.PuedeEliminarTareas
        });
    }

    // Crear usuarios nuevos dentro de TU estudio: ahora siempre requiere un Admin logueado.
    // El primer admin de un estudio nuevo se crea con POST /api/tenants/register, no acá.
    [HttpPost("register")]
    [Authorize(Roles = Roles.Admin)]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(CreateUserRequest request)
    {
        if (!Roles.EsValido(request.Role))
            return BadRequest(new { message = "Rol inválido" });

        var email = request.Email.Trim();
        var emailLower = email.ToLowerInvariant();
        // El filtro de tenant sigue activo acá (hay un Admin logueado), pero el email
        // tiene que ser único en TODA la app, no solo en este estudio.
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == emailLower))
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
            // TenantId se asigna solo (SaveChanges), con el tenant del Admin logueado
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return Ok(new { id = user.Id, email = user.Email });
    }

    // ---------- Cambiar contraseña desde "Mi perfil" ----------

    [HttpPost("change-password")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            return BadRequest(new { message = "La contraseña nueva debe tener al menos 8 caracteres" });

        if (request.NewPassword.Length > 100)
            return BadRequest(new { message = "La contraseña nueva es demasiado larga" });

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        if (!VerificarPassword(user, request.CurrentPassword ?? ""))
            return BadRequest(new { message = "La contraseña actual es incorrecta" });

        if (request.NewPassword == request.CurrentPassword)
            return BadRequest(new { message = "La contraseña nueva debe ser distinta de la actual" });

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contraseña actualizada correctamente." });
    }

    // ---------- Diagnóstico de mail (solo Admin) ----------

    [HttpPost("test-email")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TestEmail()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "No se encontró tu email en la sesión" });

        var resultado = await _sender.SendEmailAsync(
            email,
            "Prueba de mail - Legal Management System",
            "<p>Si estás leyendo esto, el envío de mails funciona.</p>");

        return Ok(new { enviadoA = email, resultado.Ok, detalle = resultado.Detail });
    }

    // ---------- Restablecer contraseña ----------

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var channel = (request.Channel ?? "").Trim().ToLower();
        if (channel is not ("email" or "sms" or "whatsapp"))
            return BadRequest(new { message = "Canal inválido" });

        if (channel == "email" && string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Ingresá tu email" });

        if (channel != "email" && NormalizarTelefono(request.Phone) == null)
            return BadRequest(new { message = "Ingresá un número de teléfono válido, con código de país" });

        var respuesta = Ok(new { message = "Si los datos son correctos, te enviamos un código." });

        var user = channel == "email"
            ? await BuscarUsuarioAsync(request.Email, null)
            : await BuscarUsuarioAsync(null, request.Phone);
        if (user == null) return respuesta;

        var ultimo = await _context.PasswordResetCodes
            .Where(c => c.UserId == user.Id)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();
        if (ultimo != null && ultimo.CreatedAt > DateTime.UtcNow.AddSeconds(-60))
            return respuesta;

        string? telefonoDestino = null;
        if (channel != "email")
        {
            telefonoDestino = NormalizarTelefono(user.Telefono);
            if (telefonoDestino == null) return respuesta;
        }

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

        if (_env.IsDevelopment())
            _logger.LogInformation("Código de recuperación para {Email}: {Code}", user.Email, code);

        var texto = $"Tu código para restablecer la contraseña de Legal Management System es {code}. Vence en 10 minutos. Si no lo pediste, ignorá este mensaje.";

        try
        {
            switch (channel)
            {
                case "email":
                    var envio = await _sender.SendEmailAsync(user.Email, "Tu código de recuperación", HtmlMail(user.FirstName, code));
                    if (!envio.Ok)
                        _logger.LogError("No se pudo enviar el código por mail a {Email}: {Detalle}", user.Email, envio.Detail);
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

    [HttpPost("verify-reset-code")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> VerifyResetCode(VerifyCodeRequest request)
    {
        var (_, registro) = await ValidarCodigoAsync(request.Email, request.Phone, request.Code);
        if (registro == null)
            return BadRequest(new { message = "Código incorrecto o vencido" });

        return Ok(new { valid = true });
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
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
            var mail = email.Trim().ToLowerInvariant();
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == mail);
        }

        var buscado = NormalizarParaComparar(phone);
        if (buscado == null) return null;

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

    private static string? NormalizarTelefono(string? tel)
    {
        if (string.IsNullOrWhiteSpace(tel)) return null;
        var limpio = new string(tel.Where(c => char.IsDigit(c) || c == '+').ToArray());
        return limpio.StartsWith("+") && limpio.Length >= 10 ? limpio : null;
    }

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
}