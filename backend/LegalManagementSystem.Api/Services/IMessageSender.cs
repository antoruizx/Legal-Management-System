namespace LegalManagementSystem.Api.Services;

public interface IMessageSender
{
    Task SendEmailAsync(string to, string subject, string html);
    Task SendSmsAsync(string toPhone, string text);
    Task SendWhatsAppAsync(string toPhone, string text);
}