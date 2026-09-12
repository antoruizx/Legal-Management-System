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
}