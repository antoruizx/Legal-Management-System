using System.ComponentModel.DataAnnotations;
using LegalManagementSystem.Api.Models;

namespace LegalManagementSystem.Api.Dtos;

public static class Roles
{
    public const string Admin = "Admin";
    public static readonly string[] Validos = { "Admin", "Abogado", "Asistente" };

    public static bool EsValido(string? rol) =>
        rol != null && Validos.Contains(rol, StringComparer.Ordinal);
}

public class CreateUserRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato de email no es válido")]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    [MaxLength(100, ErrorMessage = "La contraseña es demasiado larga")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es obligatorio")]
    public string Role { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefono { get; set; }

    public bool PuedeEditarClientes { get; set; }
    public bool PuedeEliminarClientes { get; set; }
    public bool PuedeEditarExpedientes { get; set; }
    public bool PuedeEliminarExpedientes { get; set; }
    public bool PuedeEditarTareas { get; set; }
    public bool PuedeEliminarTareas { get; set; }
}

// Solo los campos que se pueden modificar. No incluye Password: la contraseña
// se cambia únicamente con el flujo de recuperación.
public class UpdateUserRequest
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato de email no es válido")]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefono { get; set; }

    public string? AvatarUrl { get; set; }

    // Solo los aplica un Admin (y nunca sobre sí mismo)
    public string? Role { get; set; }
    public bool? PuedeEditarClientes { get; set; }
    public bool? PuedeEliminarClientes { get; set; }
    public bool? PuedeEditarExpedientes { get; set; }
    public bool? PuedeEliminarExpedientes { get; set; }
    public bool? PuedeEditarTareas { get; set; }
    public bool? PuedeEliminarTareas { get; set; }
}

public record UserDto(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string? Telefono,
    string? AvatarUrl,
    bool PuedeEditarClientes,
    bool PuedeEliminarClientes,
    bool PuedeEditarExpedientes,
    bool PuedeEliminarExpedientes,
    bool PuedeEditarTareas,
    bool PuedeEliminarTareas)
{
    public static UserDto From(User u) => new(
        u.Id, u.FirstName, u.LastName, u.Email, u.Role, u.Telefono, u.AvatarUrl,
        u.PuedeEditarClientes, u.PuedeEliminarClientes,
        u.PuedeEditarExpedientes, u.PuedeEliminarExpedientes,
        u.PuedeEditarTareas, u.PuedeEliminarTareas);
}
