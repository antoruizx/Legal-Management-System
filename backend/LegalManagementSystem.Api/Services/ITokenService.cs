using LegalManagementSystem.Api.Models;

namespace LegalManagementSystem.Api.Services;

public interface ITokenService
{
    string GenerarToken(User user);

    // Superadmin: administra todos los estudios (panel de estudios). Se define por configuración.
    bool EsSuperAdmin(User user);
}
