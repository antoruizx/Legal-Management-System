using LegalManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
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

        // Cada entidad apunta a un Tenant. Sin navegación de ida y vuelta por ahora,
        // para no tocar más archivos de los necesarios. RESTRICT: no se puede borrar
        // un Tenant si todavía tiene datos (evita borrados accidentales en cascada).
        void ConfigurarTenant<T>(ModelBuilder mb) where T : class
        {
            mb.Entity<T>()
                .HasOne<Tenant>()
                .WithMany()
                .HasForeignKey("TenantId")
                .OnDelete(DeleteBehavior.Restrict);

            mb.Entity<T>().HasIndex("TenantId");
        }

        ConfigurarTenant<User>(modelBuilder);
        ConfigurarTenant<Cliente>(modelBuilder);
        ConfigurarTenant<Expediente>(modelBuilder);
        ConfigurarTenant<Movimiento>(modelBuilder);
        ConfigurarTenant<Tarea>(modelBuilder);
        ConfigurarTenant<Documento>(modelBuilder);
    }
}