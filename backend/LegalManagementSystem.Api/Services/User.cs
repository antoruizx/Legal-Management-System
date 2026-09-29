using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace LegalManagementSystem.Api.Models;

public class User
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
    public string Email { get; set; } = string.Empty;

    // Guarda el hash BCrypt. [JsonIgnore]: nunca sale en ninguna respuesta de la API
    // (antes se filtraba en /Users, /Tareas y /Movimientos).
    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El rol es obligatorio")]
    public string Role { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefono { get; set; }

    public string? AvatarUrl { get; set; }

    public bool PuedeEditarClientes { get; set; } = false;
    public bool PuedeEliminarClientes { get; set; } = false;
    public bool PuedeEditarExpedientes { get; set; } = false;
    public bool PuedeEliminarExpedientes { get; set; } = false;
    public bool PuedeEditarTareas { get; set; } = false;
    public bool PuedeEliminarTareas { get; set; } = false;
}