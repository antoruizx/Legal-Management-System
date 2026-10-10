using LegalManagementSystem.Api.Models;

namespace LegalManagementSystem.Api.Services;

public interface ITokenService
{
    string GenerarToken(User user);
}