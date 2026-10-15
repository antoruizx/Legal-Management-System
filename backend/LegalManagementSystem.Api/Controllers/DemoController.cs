using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LegalManagementSystem.Api.Controllers;

// Datos de ejemplo para mostrar el sistema con contenido (clientes, expedientes, historial,
// tareas y usuarios). Se cargan solo en el estudio de quien llama y se reconocen por el
// dominio del email, así se pueden quitar después sin tocar los datos reales.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DemoController : ControllerBase
{
    private const string Dominio = "@ejemplo.foja";

    private readonly ApplicationDbContext _context;

    public DemoController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int UsuarioActualId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static readonly (string Nombre, string Apellido, string Rol)[] Usuarios =
    {
        ("Martín", "Salas", "Abogado"),
        ("Rocío", "Cano", "Abogado"),
        ("Sofía", "Díaz", "Asistente"),
        ("Diego", "Herrera", "Abogado"),
        ("Valentina", "Molina", "Abogado"),
        ("Tomás", "Acosta", "Asistente"),
        ("Camila", "Ortiz", "Abogado"),
        ("Federico", "Luna", "Abogado"),
        ("Julieta", "Navarro", "Asistente"),
    };

    private static readonly (string Nombre, string Apellido, string? Dni, string Email, string Telefono)[] Clientes =
    {
        ("Marta", "Gómez", "27.845.112", "marta.gomez", "381 555 1020"),
        ("Constructora", "Norte SRL", "30-71234567-8", "admin.cnorte", "381 555 2040"),
        ("Julián", "Ríos", "35.120.448", "julian.rios", "381 555 3311"),
        ("Familia", "Aguirre", null, "aguirre.fam", "381 555 7788"),
        ("Lucía", "Castro", "40.218.903", "lucia.castro", "381 555 9021"),
        ("Hernán", "Paz", "24.667.310", "hernan.paz", "381 555 4412"),
        ("Transportes", "del Valle SA", "30-70888123-4", "contacto.tdelvalle", "381 555 6100"),
        ("Carolina", "Medina", "31.902.556", "carolina.medina", "381 555 2893"),
        ("Ricardo", "Sosa", "18.445.209", "ricardo.sosa", "381 555 7045"),
        ("Farmacia", "San Martín SRL", "30-71555990-2", "administracion.fsm", "381 555 8230"),
        ("Agustina", "Romero", "38.774.120", "agustina.romero", "381 555 1976"),
        ("Oscar", "Villalba", "20.331.874", "oscar.villalba", "381 555 3658"),
        ("Paula", "Figueroa", "33.508.667", "paula.figueroa", "381 555 5127"),
        ("Cooperativa", "La Unión Ltda.", "30-68999441-7", "consejo.launion", "381 555 6904"),
    };

    // DiasAtras: hace cuánto se inició, para que los gráficos por mes tengan datos repartidos
    private static readonly (string Numero, string Caratula, string Estado, int Cliente, int DiasAtras)[] Expedientes =
    {
        ("EXP-0142", "Gómez c/ Constructora Norte s/ daños", "En trámite", 0, 150),
        ("EXP-0128", "Ríos c/ Banco Provincia s/ cobro de pesos", "Activo", 2, 165),
        ("EXP-0151", "Aguirre s/ sucesión ab intestato", "Activo", 3, 120),
        ("EXP-0160", "Castro c/ Inmobiliaria Sur s/ contrato de locación", "Activo", 4, 95),
        ("EXP-0163", "Constructora Norte c/ Municipalidad s/ contencioso administrativo", "En trámite", 1, 88),
        ("EXP-0167", "Paz c/ Seguros del Litoral s/ cumplimiento de contrato", "Activo", 5, 70),
        ("EXP-0170", "Transportes del Valle s/ concurso preventivo", "En trámite", 6, 62),
        ("EXP-0174", "Medina c/ Medina s/ divorcio", "Cerrado", 7, 140),
        ("EXP-0178", "Sosa c/ ANSES s/ reajuste de haberes", "Activo", 8, 45),
        ("EXP-0181", "Farmacia San Martín c/ Obra Social s/ cobro de facturas", "Activo", 9, 38),
        ("EXP-0185", "Romero c/ Clínica del Parque s/ mala praxis", "En trámite", 10, 27),
        ("EXP-0189", "Villalba s/ usucapión", "Archivado", 11, 170),
        ("EXP-0192", "Figueroa c/ Supermercados Unidos s/ despido", "Activo", 12, 16),
        ("EXP-0196", "Cooperativa La Unión c/ AFIP s/ impugnación de deuda", "Activo", 13, 6),
        ("EXP-0199", "Aguirre c/ Vecinos s/ medianería", "Cerrado", 3, 110),
    };

    private static readonly (string Tipo, string Descripcion)[] Movimientos =
    {
        ("Presentación", "Se presenta demanda con documental adjunta."),
        ("Notificación", "Se notifica traslado de la demanda a la contraparte."),
        ("Audiencia", "Audiencia preliminar, se fija calendario de prueba."),
        ("Presentación", "Ofrecimiento de prueba pericial."),
        ("Resolución", "Se provee la prueba ofrecida por las partes."),
        ("Notificación", "Cédula recibida con vista por cinco días."),
        ("Audiencia", "Audiencia de conciliación sin acuerdo."),
        ("Resolución", "Se notifica sentencia de primera instancia."),
        ("Otro", "Reunión con el cliente para revisar la estrategia."),
    };

    // Dias: vencimiento respecto de hoy (negativo = ya venció)
    private static readonly (string Titulo, int Expediente, int Dias, bool Completada)[] Tareas =
    {
        ("Llamar al cliente", 2, -5, false),
        ("Revisar contrato de locación", 3, -7, false),
        ("Presentar oficio al banco", 1, -2, false),
        ("Retirar cédula del juzgado", 5, -3, false),
        ("Enviar carta documento", 12, -1, false),
        ("Contestar demanda", 0, 2, false),
        ("Audiencia de conciliación", 12, 1, false),
        ("Presentar pericia contable", 4, 1, false),
        ("Pagar tasa de justicia", 13, 2, false),
        ("Presentar alegatos", 1, 4, false),
        ("Audiencia testimonial", 10, 3, false),
        ("Pedir informe pericial", 0, 6, false),
        ("Reunión con cliente", 2, 9, false),
        ("Preparar memorial", 8, 14, false),
        ("Verificar créditos del concurso", 6, 20, false),
        ("Notificar al cliente", 0, -4, true),
        ("Redactar demanda", 9, -20, true),
        ("Solicitar partida de defunción", 2, -30, true),
        ("Firmar convenio regulador", 7, -60, true),
    };

    // POST: api/Demo
    [HttpPost]
    public async Task<IActionResult> Cargar()
    {
        if (await _context.Clientes.AnyAsync(c => c.Email != null && c.Email.EndsWith(Dominio)))
            return Conflict(new { message = "Los datos de ejemplo ya están cargados" });

        var admin = await _context.Users.FindAsync(UsuarioActualId);
        if (admin == null) return Unauthorized();

        var ahora = DateTime.UtcNow;
        // "Hoy" según la hora de Argentina (UTC-3): si no, de noche los vencimientos se corren un día
        var hoy = ahora.AddHours(-3).Date;

        // El email es único en toda la app: se le agrega el id del estudio.
        // La contraseña es aleatoria: son usuarios para mostrar, no para iniciar sesión.
        var usuarios = Usuarios.Select(u => new User
        {
            FirstName = u.Nombre,
            LastName = u.Apellido,
            Email = $"{SinAcentos(u.Nombre)}.{SinAcentos(u.Apellido)}.{admin.TenantId}{Dominio}",
            Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            Role = u.Rol,
            PuedeEditarClientes = true,
            PuedeEditarExpedientes = u.Rol == "Abogado",
            PuedeEditarTareas = true,
            PuedeEliminarTareas = u.Rol == "Abogado"
        }).ToList();
        _context.Users.AddRange(usuarios);

        var responsables = new List<User> { admin };
        responsables.AddRange(usuarios);

        var clientes = Clientes.Select((c, i) => new Cliente
        {
            Nombre = c.Nombre,
            Apellido = c.Apellido,
            DNI = c.Dni,
            Email = c.Email + Dominio,
            Telefono = c.Telefono,
            FechaAlta = ahora.AddDays(-(i < 10 ? 180 - i * 15 : 14 - i))
        }).ToList();
        _context.Clientes.AddRange(clientes);

        var numerosUsados = (await _context.Expedientes.Select(e => e.Numero).ToListAsync()).ToHashSet();

        var expedientes = new List<Expediente>();
        for (var i = 0; i < Expedientes.Length; i++)
        {
            var e = Expedientes[i];
            var inicio = ahora.AddDays(-e.DiasAtras);
            var expediente = new Expediente
            {
                Numero = numerosUsados.Contains(e.Numero) ? $"{e.Numero}-E" : e.Numero,
                Caratula = e.Caratula,
                Estado = e.Estado,
                FechaInicio = inicio,
                FechaCreacion = inicio,
                Cliente = clientes[e.Cliente]
            };
            expedientes.Add(expediente);

            var cliente = clientes[e.Cliente];
            _context.Movimientos.Add(new Movimiento
            {
                Expediente = expediente,
                User = admin,
                Tipo = "Creación",
                Descripcion = $"Expediente creado y asignado a {cliente.Nombre} {cliente.Apellido}.",
                Fecha = inicio
            });

            // Tres movimientos más, repartidos entre el inicio y hoy
            for (var k = 0; k < 3; k++)
            {
                var plantilla = Movimientos[(i * 2 + k) % Movimientos.Length];
                _context.Movimientos.Add(new Movimiento
                {
                    Expediente = expediente,
                    User = responsables[(i + k) % responsables.Count],
                    Tipo = plantilla.Tipo,
                    Descripcion = plantilla.Descripcion,
                    Fecha = inicio.AddDays(e.DiasAtras * (k + 1) / 4.0)
                });
            }
        }
        _context.Expedientes.AddRange(expedientes);

        for (var i = 0; i < Tareas.Length; i++)
        {
            var t = Tareas[i];
            _context.Tareas.Add(new Tarea
            {
                Titulo = t.Titulo,
                Descripcion = $"Tarea de ejemplo del expediente {expedientes[t.Expediente].Numero}.",
                // 13:00 UTC = 10:00 en Argentina
                FechaVencimiento = hoy.AddDays(t.Dias).AddHours(13),
                FechaCreacion = ahora.AddDays(Math.Min(t.Dias, 0) - 10),
                Completada = t.Completada,
                Expediente = expedientes[t.Expediente],
                User = responsables[i % responsables.Count]
            });
        }

        // Un solo SaveChanges: si algo falla no queda nada a medio cargar
        await _context.SaveChangesAsync();

        return Ok(new
        {
            usuarios = usuarios.Count,
            clientes = clientes.Count,
            expedientes = expedientes.Count,
            movimientos = expedientes.Count * 4,
            tareas = Tareas.Length
        });
    }

    // DELETE: api/Demo
    [HttpDelete]
    public async Task<IActionResult> Quitar()
    {
        var actorId = UsuarioActualId;

        var usuarios = await _context.Users.Where(u => u.Email.EndsWith(Dominio)).ToListAsync();
        var idsUsuarios = usuarios.Select(u => u.Id).ToList();

        var clientes = await _context.Clientes.Where(c => c.Email != null && c.Email.EndsWith(Dominio)).ToListAsync();
        var idsClientes = clientes.Select(c => c.Id).ToList();

        var expedientes = await _context.Expedientes.Where(e => idsClientes.Contains(e.ClienteId)).ToListAsync();
        var idsExpedientes = expedientes.Select(e => e.Id).ToList();

        var documentos = await _context.Documentos.Where(d => idsExpedientes.Contains(d.ExpedienteId)).ToListAsync();
        var carpeta = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        foreach (var d in documentos)
        {
            var ruta = Path.Combine(carpeta, d.NombreArchivoInterno);
            if (System.IO.File.Exists(ruta)) System.IO.File.Delete(ruta);
        }
        _context.Documentos.RemoveRange(documentos);

        _context.Tareas.RemoveRange(await _context.Tareas.Where(t => idsExpedientes.Contains(t.ExpedienteId)).ToListAsync());
        _context.Movimientos.RemoveRange(await _context.Movimientos.Where(m => idsExpedientes.Contains(m.ExpedienteId)).ToListAsync());

        // Lo que quedó a nombre de un usuario de ejemplo en expedientes reales pasa a quien quita los datos
        foreach (var t in await _context.Tareas.Where(t => idsUsuarios.Contains(t.UserId) && !idsExpedientes.Contains(t.ExpedienteId)).ToListAsync())
            t.UserId = actorId;
        foreach (var m in await _context.Movimientos.Where(m => idsUsuarios.Contains(m.UserId) && !idsExpedientes.Contains(m.ExpedienteId)).ToListAsync())
            m.UserId = actorId;

        _context.PasswordResetCodes.RemoveRange(await _context.PasswordResetCodes.Where(c => idsUsuarios.Contains(c.UserId)).ToListAsync());

        _context.Expedientes.RemoveRange(expedientes);
        _context.Clientes.RemoveRange(clientes);
        _context.Users.RemoveRange(usuarios);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string SinAcentos(string texto) =>
        new string(texto.ToLowerInvariant()
            .Normalize(System.Text.NormalizationForm.FormD)
            .Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
            .ToArray());
}
