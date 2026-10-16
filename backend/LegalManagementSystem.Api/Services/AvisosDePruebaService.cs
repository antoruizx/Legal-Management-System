using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Dtos;
using LegalManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Services;

// Cada hora busca estudios en prueba y manda por mail, una sola vez cada uno, el aviso de
// "te quedan N días" (cuando faltan Tenant.DiasAvisoPorVencer o menos) y el de "terminó la prueba".
// Si el servidor estuvo dormido, al despertar manda lo que haya quedado pendiente.
public class AvisosDePruebaService : BackgroundService
{
    private static readonly TimeSpan Intervalo = TimeSpan.FromHours(1);

    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<AvisosDePruebaService> _logger;

    public AvisosDePruebaService(IServiceScopeFactory scopes, ILogger<AvisosDePruebaService> logger)
    {
        _scopes = scopes;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Deja arrancar la API (y aplicar migraciones) antes de la primera revisión
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RevisarAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falló la revisión de avisos de prueba");
            }
            await Task.Delay(Intervalo, stoppingToken);
        }
    }

    public async Task RevisarAsync()
    {
        using var scope = _scopes.CreateScope();
        // Sin usuario logueado el filtro de tenant no aplica: ve todos los estudios
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var sender = scope.ServiceProvider.GetRequiredService<IMessageSender>();
        var contactos = scope.ServiceProvider.GetRequiredService<ContactoComercial>();

        var ahora = DateTime.UtcNow;
        var limiteAviso = ahora.AddDays(Tenant.DiasAvisoPorVencer);

        var pendientes = await context.Tenants
            .Where(t => t.Active && t.PruebaHasta != null && (
                (t.PruebaHasta > ahora && t.PruebaHasta <= limiteAviso && t.AvisoPorVencerEnviado == null) ||
                (t.PruebaHasta <= ahora && t.AvisoVencidoEnviado == null)))
            .ToListAsync();

        foreach (var tenant in pendientes)
        {
            var admins = await context.Users
                .Where(u => u.TenantId == tenant.Id && u.Role == Roles.Admin)
                .ToListAsync();
            var contacto = await contactos.ParaEstudioAsync(tenant);
            var vencida = tenant.PruebaHasta <= ahora;
            var dias = Math.Max(1, (int)Math.Ceiling((tenant.PruebaHasta!.Value - ahora).TotalDays));

            var enviado = false;
            foreach (var admin in admins)
            {
                var (asunto, html) = vencida
                    ? ($"Terminó tu prueba gratis de Foja", PlantillasMail.PruebaVencida(admin.FirstName, tenant.Name, contacto))
                    : ($"Te {(dias == 1 ? "queda 1 día" : $"quedan {dias} días")} de prueba en Foja", PlantillasMail.PruebaPorVencer(admin.FirstName, tenant.Name, dias, contacto));

                var resultado = await sender.SendEmailAsync(admin.Email, asunto, html);
                if (resultado.Ok) enviado = true;
                else _logger.LogError("No se pudo mandar el aviso de prueba a {Email}: {Detalle}", admin.Email, resultado.Detail);
            }

            // Si no salió ningún mail (Brevo caído o sin configurar) se reintenta en la próxima vuelta
            if (!enviado) continue;

            if (vencida)
            {
                tenant.AvisoVencidoEnviado = ahora;
                // Si nunca le llegó el de "por vencer" (por ejemplo, el server estuvo apagado), ya no tiene sentido
                tenant.AvisoPorVencerEnviado ??= ahora;
            }
            else
            {
                tenant.AvisoPorVencerEnviado = ahora;
            }
            await context.SaveChangesAsync();
            _logger.LogInformation("Aviso de prueba {Tipo} enviado al estudio {Estudio}", vencida ? "vencida" : "por vencer", tenant.Name);
        }
    }
}
