using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace LegalManagementSystem.Api.Services;

public class MessageSender : IMessageSender
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<MessageSender> _logger;

    public MessageSender(HttpClient http, IConfiguration config, ILogger<MessageSender> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<SendResult> SendEmailAsync(string to, string subject, string html)
    {
        var apiKey = _config["Brevo:ApiKey"];
        var senderEmail = _config["Brevo:SenderEmail"];
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(senderEmail))
        {
            const string faltan = "Brevo no está configurado: faltan las variables Brevo__ApiKey y/o Brevo__SenderEmail en el servidor.";
            _logger.LogWarning(faltan);
            return new SendResult(false, faltan);
        }

        var payload = new
        {
            sender = new { name = _config["Brevo:SenderName"] ?? "Legal Management System", email = senderEmail },
            to = new[] { new { email = to } },
            subject,
            htmlContent = html
        };

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            req.Headers.Add("api-key", apiKey);
            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var res = await _http.SendAsync(req);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogError("Brevo devolvió {Status}: {Body}", (int)res.StatusCode, body);
                return new SendResult(false, $"Brevo respondió {(int)res.StatusCode}: {body}");
            }

            _logger.LogInformation("Brevo aceptó el mail para {To}: {Body}", to, body);
            return new SendResult(true, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo contactar a Brevo");
            return new SendResult(false, $"No se pudo contactar a Brevo: {ex.Message}");
        }
    }

    public Task SendSmsAsync(string toPhone, string text)
        => SendTwilioAsync(_config["Twilio:SmsFrom"], toPhone, text);

    public Task SendWhatsAppAsync(string toPhone, string text)
    {
        var from = _config["Twilio:WhatsAppFrom"];
        return SendTwilioAsync(
            string.IsNullOrEmpty(from) ? null : $"whatsapp:{from}",
            $"whatsapp:{toPhone}",
            text);
    }

    private async Task SendTwilioAsync(string? from, string to, string body)
    {
        var sid = _config["Twilio:AccountSid"];
        var token = _config["Twilio:AuthToken"];
        if (string.IsNullOrEmpty(sid) || string.IsNullOrEmpty(token) || string.IsNullOrEmpty(from))
        {
            _logger.LogWarning("Twilio no está configurado: no se envió el mensaje.");
            return;
        }

        using var req = new HttpRequestMessage(
            HttpMethod.Post,
            $"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json");
        req.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic", Convert.ToBase64String(Encoding.ASCII.GetBytes($"{sid}:{token}")));
        req.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["From"] = from,
            ["To"] = to,
            ["Body"] = body
        });

        var res = await _http.SendAsync(req);
        if (!res.IsSuccessStatusCode)
            _logger.LogError("Twilio devolvió {Status}: {Body}", res.StatusCode, await res.Content.ReadAsStringAsync());
    }
}