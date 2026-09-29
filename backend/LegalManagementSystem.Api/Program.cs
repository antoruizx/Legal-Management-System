using LegalManagementSystem.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

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

builder.Services.AddHttpClient<IMessageSender, MessageSender>();

// --- Configuración de JWT ---
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

// Si falta la clave (o es corta) preferimos que la app falle al arrancar con un mensaje claro,
// en vez de dar errores raros de login más tarde.
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetBytes(jwtKey).Length < 32)
    throw new InvalidOperationException("Jwt:Key no está configurada o tiene menos de 32 bytes. Definila como variable de entorno Jwt__Key.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();
// --- Fin configuración de JWT ---

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                  return uri.Host == "legalmsystem.netlify.app" ||
                         uri.Host.EndsWith(".netlify.app") ||
                         uri.Host == "localhost";
              })
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Render (y Netlify) van detrás de un proxy: sin esto todas las personas parecen tener la misma IP
// y el límite de intentos de login afectaría a todos juntos.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Freno a la fuerza bruta: máximo 10 intentos por minuto y por IP en login / recuperación de contraseña
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

var app = builder.Build();

app.UseForwardedHeaders();

// Aplica automáticamente las migraciones pendientes contra la base de datos
// configurada (local o la de Render, según el entorno) al arrancar la app.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

var port = Environment.GetEnvironmentVariable("PORT") ?? "5160";
app.Urls.Add($"http://0.0.0.0:{port}");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api", () => "Legal Management System API funcionando");
app.MapGet("/api/version", () => "v2-cors-fix");

app.MapControllers();

app.Run();
