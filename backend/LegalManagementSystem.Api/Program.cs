using LegalManagementSystem.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  var uri = new Uri(origin);
                  return uri.Host == "legalmsystem.netlify.app" ||
                         uri.Host.EndsWith(".netlify.app") ||
                         uri.Host == "localhost";
              })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") ?? "5160";
app.Urls.Add($"http://0.0.0.0:{port}");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.MapGet("/api", () => "Legal Management System API funcionando");
app.MapGet("/api/version", () => "v2-cors-fix");

app.MapControllers();

// TEMPORAL: endpoint de diagnóstico para ver qué tablas existen realmente.
// Borrar esta ruta una vez resuelto el problema.
app.MapGet("/api/debug-tables", async (ApplicationDbContext db) =>
{
    var tablas = await db.Database
        .SqlQueryRaw<string>("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        .ToListAsync();
    return Results.Ok(tablas);
});

app.Run();