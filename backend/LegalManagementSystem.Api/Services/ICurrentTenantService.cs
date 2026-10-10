namespace LegalManagementSystem.Api.Services;

public interface ICurrentTenantService
{
    int? TenantId { get; }
}