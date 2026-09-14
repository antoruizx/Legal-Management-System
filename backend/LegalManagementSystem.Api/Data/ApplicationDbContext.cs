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
}
