namespace LegalManagementSystem.Api.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentTenantService(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    // null cuando nadie está logueado (login, recuperar contraseña, alta de estudio nuevo).
    // En ese caso el filtro del DbContext se desactiva a propósito.
    public int? TenantId
    {
        get
        {
            var valor = _accessor.HttpContext?.User?.FindFirst("tenantId")?.Value;
            return int.TryParse(valor, out var id) ? id : null;
        }
    }
}