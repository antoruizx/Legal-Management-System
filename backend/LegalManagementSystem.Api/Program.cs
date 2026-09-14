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

builder.Services.AddCors(options => { options.AddPolicy("AllowFrontend", policy => { policy.WithOrigins( "http://localhost:5173", "https://legalmsystem.netlify.app" ) .AllowAnyHeader() .AllowAnyMethod(); }); });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.MapGet("/api", () => "Legal Management System API funcionando");

app.MapControllers();

app.Run();