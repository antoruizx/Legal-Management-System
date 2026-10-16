namespace LegalManagementSystem.Api.Models;

// Código de 6 dígitos que se manda por mail antes de crear un estudio, para confirmar
// que el email es de quien se registra. No pertenece a ningún estudio (todavía no existe).
public class VerificacionEmail
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty; // en minúsculas
    public string CodeHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public int Attempts { get; set; }
    public bool Used { get; set; }
}
