using LegalManagementSystem.Api.Models;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LegalManagementSystem.Api.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerarToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var jwtIssuer = _configuration["Jwt:Issuer"]!;
        var jwtAudience = _configuration["Jwt:Audience"]!;
        var horas = double.Parse(_configuration["Jwt:ExpiraEnHoras"] ?? "8", CultureInfo.InvariantCulture);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
            new Claim("tenantId", user.TenantId.ToString()),
        };

        if (EsSuperAdmin(user))
            claims.Add(new Claim("superAdmin", "true"));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(horas),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Los superadmins no se guardan en la base: SuperAdmin:Emails es una lista de emails
    // separados por coma (en producción, variable de entorno SuperAdmin__Emails).
    // OJO: tiene que ser el email de una cuenta que ya exista; si no, cualquiera podría registrarlo.
    public bool EsSuperAdmin(User user)
    {
        var emails = (_configuration["SuperAdmin:Emails"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return emails.Contains(user.Email.Trim(), StringComparer.OrdinalIgnoreCase);
    }
}