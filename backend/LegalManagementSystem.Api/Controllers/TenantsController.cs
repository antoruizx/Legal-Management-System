using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace LegalManagementSystem.Api.Controllers;

public class RegisterTenantRequest
{
    public string StudioName { get; set; } = string.Empty;
    public string AdminFirstName { get; set; } = string.Empty;
    public string AdminLastName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPassword { get; set; } = string.Empty;
    public string InvitationCode { get; set; } = string.Empty;

    // Solo en el segundo paso (register): el que llegó por mail
    public string? CodigoVerificacion { get; set; }
}

public class SetTenantActiveRequest
{
    public bool Active { get; set; }
}

public class ExtenderPruebaRequest
{
    public int Dias { get; set; } = Tenant.DiasDePrueba;
}

[ApiController]
[Route("api/[controller]")]
public class TenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly IMessageSender _sender;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(
        ApplicationDbContext context,
        ITokenService tokenService,
        IConfiguration configuration,
        IMessageSender sender,
        IWebHostEnvironment env,
        ILogger<TenantsController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
        _sender = sender;
        _env = env;
        _logger = logger;
    }

    // ---------- Panel de estudios (solo superadmin) ----------

    // GET: api/Tenants
    [HttpGet]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> GetTenants()
    {
        // El superadmin también pertenece a un estudio: sin IgnoreQueryFilters solo vería sus propios usuarios
        var usuarios = await _context.Users.IgnoreQueryFilters()
            .OrderBy(u => u.Id)
            .Select(u => new { u.Id, u.TenantId, u.Email, u.Role, u.FirstName, u.LastName, u.EsVendedor })
            .ToListAsync();

        var tenants = await _context.Tenants.OrderBy(t => t.Id).ToListAsync();

        return Ok(tenants.Select(t =>
        {
            var vendedor = usuarios.FirstOrDefault(u => u.Id == t.VendedorId);
            return new
            {
                t.Id,
                t.Name,
                t.Slug,
                t.CreatedAt,
                t.Active,
                t.PruebaHasta,
                Vendedor = vendedor == null ? null : $"{vendedor.FirstName} {vendedor.LastName}",
                // Estudio de demostración de un vendedor (no es un cliente)
                EsDeVendedor = usuarios.Any(u => u.TenantId == t.Id && u.EsVendedor),
                Usuarios = usuarios.Count(u => u.TenantId == t.Id),
                AdminEmail = usuarios.FirstOrDefault(u => u.TenantId == t.Id && u.Role == Roles.Admin)?.Email
            };
        }));
    }

    // PUT: api/Tenants/5/extender-prueba  (suma días desde hoy o desde el fin actual, lo que sea más tarde)
    [HttpPut("{id}/extender-prueba")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> ExtenderPrueba(int id, ExtenderPruebaRequest request)
    {
        if (request.Dias < 1 || request.Dias > 365)
            return BadRequest(new { message = "Elegí entre 1 y 365 días" });

        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        var desde = tenant.PruebaHasta > DateTime.UtcNow ? tenant.PruebaHasta.Value : DateTime.UtcNow;
        tenant.PruebaHasta = desde.AddDays(request.Dias);
        // Con la fecha nueva, los avisos por mail se vuelven a mandar cuando corresponda
        tenant.AvisoPorVencerEnviado = null;
        tenant.AvisoVencidoEnviado = null;
        await _context.SaveChangesAsync();
        return Ok(new { tenant.PruebaHasta });
    }

    // PUT: api/Tenants/5/activar-pago  (deja de ser prueba: ya no vence)
    [HttpPut("{id}/activar-pago")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> ActivarPago(int id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        tenant.PruebaHasta = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/Tenants/5/active
    [HttpPut("{id}/active")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> SetActive(int id, SetTenantActiveRequest request)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        if (!request.Active && User.FindFirst("tenantId")?.Value == id.ToString())
            return BadRequest(new { message = "No podés desactivar tu propio estudio" });

        tenant.Active = request.Active;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Alta de estudio ----------

    // El alta tiene dos pasos, los dos públicos (nadie está logueado todavía):
    // 1. register/enviar-codigo: valida los datos y manda un código de 6 dígitos al email.
    // 2. register: con ese código, crea el estudio y su primer usuario Admin.
    // Hace falta un código de invitación: uno de un solo uso generado por un vendedor (CodigosController)
    // o el código general Registro:Codigo (en producción, variable Registro__Codigo).
    // Todo estudio nuevo arranca con Tenant.DiasDePrueba días de prueba; el superadmin lo pasa a pago.

    [HttpPost("register/enviar-codigo")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> EnviarCodigoRegistro(RegisterTenantRequest request)
    {
        var (error, _, email) = await ValidarDatosRegistroAsync(request);
        if (error != null) return error;

        var respuesta = Ok(new { message = $"Te enviamos un código a {email}." });

        // Un código por minuto por email: evita que usen el formulario para mandar mails en cantidad
        var ultimo = await _context.VerificacionesEmail
            .Where(v => v.Email == email)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();
        if (ultimo != null && ultimo.CreatedAt > DateTime.UtcNow.AddSeconds(-60))
            return BadRequest(new { message = "Ya te mandamos un código hace menos de un minuto. Revisá tu correo (también la carpeta de spam)." });

        var anteriores = await _context.VerificacionesEmail.Where(v => v.Email == email && !v.Used).ToListAsync();
        foreach (var v in anteriores) v.Used = true;

        var codigo = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        _context.VerificacionesEmail.Add(new VerificacionEmail
        {
            Email = email,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(codigo),
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        });
        await _context.SaveChangesAsync();

        if (_env.IsDevelopment())
            _logger.LogInformation("Código de verificación de registro para {Email}: {Codigo}", email, codigo);

        var envio = await _sender.SendEmailAsync(
            request.AdminEmail.Trim(),
            $"Tu código para crear tu estudio en Foja: {codigo}",
            PlantillasMail.CodigoVerificacion(request.AdminFirstName.Trim(), codigo));

        if (!envio.Ok)
        {
            _logger.LogError("No se pudo enviar el código de registro a {Email}: {Detalle}", email, envio.Detail);
            // En desarrollo el código quedó en el log, así que se puede seguir sin mail
            if (!_env.IsDevelopment())
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { message = "No pudimos enviarte el mail con el código. Probá de nuevo en unos minutos." });
        }

        return respuesta;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterTenantRequest request)
    {
        var (error, codigoVendedor, email) = await ValidarDatosRegistroAsync(request);
        if (error != null) return error;

        var ahora = DateTime.UtcNow;

        var verificacion = await _context.VerificacionesEmail
            .Where(v => v.Email == email && !v.Used && v.ExpiresAt > ahora)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();
        if (verificacion == null || verificacion.Attempts >= 5)
            return BadRequest(new { message = "El código de verificación venció. Pedí uno nuevo." });

        if (!BCrypt.Net.BCrypt.Verify((request.CodigoVerificacion ?? "").Trim(), verificacion.CodeHash))
        {
            verificacion.Attempts++;
            await _context.SaveChangesAsync();
            return BadRequest(new { message = "El código de verificación es incorrecto." });
        }
        verificacion.Used = true;
        await _context.SaveChangesAsync();

        var slugBase = GenerarSlug(request.StudioName);
        var slug = slugBase;
        var sufijo = 1;
        while (await _context.Tenants.AnyAsync(t => t.Slug == slug))
            slug = $"{slugBase}-{++sufijo}";

        // Se "toma" el código recién ahora, con todos los datos validados (si no, un error de tipeo
        // en el email lo quemaría). El UPDATE condicional evita que dos registros usen el mismo código.
        if (codigoVendedor != null)
        {
            var tomado = await _context.CodigosInvitacion
                .Where(c => c.Id == codigoVendedor.Id && c.UsadoEl == null)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.UsadoEl, ahora));
            if (tomado == 0)
                return BadRequest(new { message = "El código de invitación no es válido o ya fue usado" });
        }

        // El estudio del dueño de Foja (email en SuperAdmin:Emails) no tiene prueba que venza
        var esDelSuperAdmin = _tokenService.EsSuperAdmin(new User { Email = email });

        var tenant = new Tenant
        {
            Name = request.StudioName.Trim(),
            Slug = slug,
            PruebaHasta = esDelSuperAdmin ? null : ahora.AddDays(Tenant.DiasDePrueba),
            VendedorId = codigoVendedor?.VendedorId
        };
        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(); // necesitamos el Id generado antes de crear el usuario

        if (codigoVendedor != null)
        {
            await _context.CodigosInvitacion
                .Where(c => c.Id == codigoVendedor.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.TenantId, tenant.Id));
        }

        var admin = new User
        {
            FirstName = request.AdminFirstName.Trim(),
            LastName = request.AdminLastName.Trim(),
            Email = request.AdminEmail.Trim(),
            Password = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
            Role = Roles.Admin,
            TenantId = tenant.Id, // nadie logueado: no se autoasigna solo, lo ponemos a mano
            PuedeEditarClientes = true,
            PuedeEliminarClientes = true,
            PuedeEditarExpedientes = true,
            PuedeEliminarExpedientes = true,
            PuedeEditarTareas = true,
            PuedeEliminarTareas = true
        };
        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerarToken(admin);

        return Ok(new
        {
            token,
            id = admin.Id,
            firstName = admin.FirstName,
            lastName = admin.LastName,
            email = admin.Email,
            role = admin.Role,
            tenantId = tenant.Id,
            tenantName = tenant.Name,
            pruebaHasta = tenant.PruebaHasta,
            esSuperAdmin = _tokenService.EsSuperAdmin(admin),
            esVendedor = false,
            puedeEditarClientes = true,
            puedeEliminarClientes = true,
            puedeEditarExpedientes = true,
            puedeEliminarExpedientes = true,
            puedeEditarTareas = true,
            puedeEliminarTareas = true
        });
    }

    // Validaciones comunes a los dos pasos del alta. No "toma" el código de invitación: eso se hace
    // recién al crear el estudio, para que un error de tipeo no lo queme.
    private async Task<(IActionResult? error, CodigoInvitacion? codigoVendedor, string email)> ValidarDatosRegistroAsync(RegisterTenantRequest request)
    {
        var codigoIngresado = (request.InvitationCode ?? "").Trim().ToUpperInvariant();
        var email = (request.AdminEmail ?? "").Trim().ToLowerInvariant();

        var codigoVendedor = await _context.CodigosInvitacion
            .FirstOrDefaultAsync(c => c.Codigo == codigoIngresado && c.UsadoEl == null && c.VenceEl > DateTime.UtcNow);

        var codigoGeneral = _configuration["Registro:Codigo"];
        var esCodigoGeneral = codigoVendedor == null
            && !string.IsNullOrWhiteSpace(codigoGeneral)
            && CodigoValido(request.InvitationCode, codigoGeneral);

        if (codigoVendedor == null && !esCodigoGeneral)
            return (BadRequest(new { message = "El código de invitación no es válido o ya fue usado" }), null, email);

        if (string.IsNullOrWhiteSpace(request.StudioName))
            return (BadRequest(new { message = "El nombre del estudio es obligatorio" }), null, email);

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.AdminPassword))
            return (BadRequest(new { message = "Email y contraseña son obligatorios" }), null, email);

        if (request.AdminPassword.Length < 8)
            return (BadRequest(new { message = "La contraseña debe tener al menos 8 caracteres" }), null, email);

        // Nadie logueado todavía: busca en todos los estudios (el email es único en toda la app)
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
            return (BadRequest(new { message = "Ya existe una cuenta con ese email" }), null, email);

        return (null, codigoVendedor, email);
    }

    // Comparación en tiempo constante: no deja adivinar el código midiendo cuánto tarda la respuesta
    private static bool CodigoValido(string? recibido, string esperado) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes((recibido ?? "").Trim()),
            Encoding.UTF8.GetBytes(esperado.Trim()));

    private static string GenerarSlug(string nombre)
    {
        var normalizado = nombre.Trim().ToLowerInvariant();
        var sinAcentos = new string(normalizado
            .Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray());
        var limpio = Regex.Replace(sinAcentos, "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(limpio) ? "estudio" : limpio;
    }
}