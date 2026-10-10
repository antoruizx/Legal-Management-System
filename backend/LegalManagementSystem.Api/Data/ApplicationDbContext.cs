using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ICurrentTenantService _tenantService;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentTenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Expediente> Expedientes { get; set; }
    public DbSet<Movimiento> Movimientos { get; set; }
    public DbSet<Tarea> Tareas { get; set; }
    public DbSet<Documento> Documentos { get; set; }
    public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();
    public DbSet<Tenant> Tenants => Set<Tenant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.Slug)
            .IsUnique();

        void ConfigurarTenant<T>(ModelBuilder mb) where T : class
        {
            mb.Entity<T>()
                .HasOne<Tenant>()
                .WithMany()
                .HasForeignKey("TenantId")
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<T>().HasIndex("TenantId");

            // Si no hay nadie logueado (TenantId == null), no filtra nada: hace falta
            // para que el login y la recuperación de contraseña busquen por email
            // sin importar de qué estudio es. Si hay alguien logueado, solo ve lo suyo.
            mb.Entity<T>().HasQueryFilter(e =>
                _tenantService.TenantId == null ||
                EF.Property<int>(e, "TenantId") == _tenantService.TenantId);
        }

        ConfigurarTenant<User>(modelBuilder);
        ConfigurarTenant<Cliente>(modelBuilder);
        ConfigurarTenant<Expediente>(modelBuilder);
        ConfigurarTenant<Movimiento>(modelBuilder);
        ConfigurarTenant<Tarea>(modelBuilder);
        ConfigurarTenant<Documento>(modelBuilder);
    }

    // Al crear un Cliente, Expediente, Tarea, etc. nuevo, le pone el TenantId del usuario
    // logueado automáticamente. Así no hace falta tocar cada controller (ClientesController,
    // ExpedientesController...) para que asignen el TenantId a mano.
    // Al modificar, el TenantId nunca se escribe: el cliente no puede mover registros de estudio.
    public override int SaveChanges()
    {
        AsignarTenantANuevasEntidades();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        AsignarTenantANuevasEntidades();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void AsignarTenantANuevasEntidades()
    {
        var tenantId = _tenantService.TenantId;
        if (tenantId == null) return; // sin sesión: quien crea el registro asigna el TenantId a mano (alta de estudio)

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State != EntityState.Added && entry.State != EntityState.Modified) continue;
            if (!entry.Metadata.GetProperties().Any(p => p.Name == "TenantId")) continue;

            var prop = entry.Property("TenantId");
            if (entry.State == EntityState.Added)
                prop.CurrentValue = tenantId.Value; // siempre el del token: se ignora lo que venga en el body
            else
                prop.IsModified = false; // un registro nunca cambia de estudio
        }
    }
}