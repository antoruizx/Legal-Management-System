namespace LegalManagementSystem.Api.Services;

public record SendResult(bool Ok, string Detail);

public interface IMessageSender
{
    Task<SendResult> SendEmailAsync(string to, string subject, string html);
    Task SendSmsAsync(string toPhone, string text);
    Task SendWhatsAppAsync(string toPhone, string text);
}
