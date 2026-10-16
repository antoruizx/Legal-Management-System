using System.Net;

namespace LegalManagementSystem.Api.Services;

// HTML de los mails de Foja. Estilos en línea y tablas: es lo único que respetan todos los clientes de correo.
public static class PlantillasMail
{
    private static string E(string? texto) => WebUtility.HtmlEncode(texto ?? "");

    private static string Marco(string contenido) => $@"
<div style=""background:#F4F7FC;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0F1B2D"">
  <table role=""presentation"" width=""100%"" style=""max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #DCE3EF"">
    <tr><td style=""background:#1D4ED8;border-radius:16px 16px 0 0;padding:20px 28px;color:#ffffff"">
      <div style=""font-size:24px;font-weight:bold"">Foja</div>
      <div style=""font-size:11px;letter-spacing:2px;color:#C7D8FF"">GESTIÓN JURÍDICA</div>
    </td></tr>
    <tr><td style=""padding:28px"">{contenido}</td></tr>
  </table>
</div>";

    public static string CodigoVerificacion(string nombre, string codigo) => Marco($@"
      <h2 style=""margin:0 0 8px;font-size:20px"">Hola {E(nombre)},</h2>
      <p style=""margin:0 0 16px;color:#5B6B85"">Usá este código para confirmar tu email y crear tu estudio en Foja:</p>
      <p style=""font-size:34px;letter-spacing:10px;font-weight:bold;margin:20px 0;color:#1D4ED8"">{E(codigo)}</p>
      <p style=""margin:0;color:#5B6B85;font-size:13px"">Vence en 15 minutos. Si no fuiste vos, ignorá este mensaje.</p>");

    public static string PruebaPorVencer(string nombre, string estudio, int dias, Contacto contacto) => Marco($@"
      <h2 style=""margin:0 0 8px;font-size:20px"">Hola {E(nombre)},</h2>
      <p style=""margin:0 0 12px;color:#5B6B85"">A la prueba gratis de <b style=""color:#0F1B2D"">{E(estudio)}</b> en Foja le {(dias == 1 ? "queda <b style=\"color:#0F1B2D\">1 día</b>" : $"quedan <b style=\"color:#0F1B2D\">{dias} días</b>")}.</p>
      <p style=""margin:0 0 20px;color:#5B6B85"">Para seguir usando el sistema sin perder nada de lo que cargaste, contactá a tu asesor:</p>
      {BloqueContacto(contacto)}");

    public static string PruebaVencida(string nombre, string estudio, Contacto contacto) => Marco($@"
      <h2 style=""margin:0 0 8px;font-size:20px"">Hola {E(nombre)},</h2>
      <p style=""margin:0 0 12px;color:#5B6B85"">Terminó la prueba gratis de <b style=""color:#0F1B2D"">{E(estudio)}</b> en Foja.</p>
      <p style=""margin:0 0 20px;color:#5B6B85"">Tus datos están guardados: apenas contrates el servicio, entrás y seguís donde estabas. Contactá a tu asesor:</p>
      {BloqueContacto(contacto)}");

    private static string BloqueContacto(Contacto c)
    {
        var botones = c.LinkContratar == null ? "" : $@"
      <a href=""{E(c.LinkContratar)}"" style=""display:block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:bold;text-align:center;padding:13px 16px;border-radius:10px;margin:0 0 10px"">Me interesa contratar el servicio</a>
      <a href=""{E(c.LinkDudas)}"" style=""display:block;background:#ffffff;color:#0F1B2D;text-decoration:none;font-weight:bold;text-align:center;padding:12px 16px;border-radius:10px;border:1px solid #DCE3EF;margin:0 0 16px"">Tengo algunas dudas, ¿me podrías asesorar más?</a>";

        var datos = $"<b>{E(c.Nombre)}</b>"
            + (c.Whatsapp != null ? $"<br>WhatsApp: +{E(c.Whatsapp)}" : "")
            + (c.Email != null ? $"<br>Email: <a href=\"mailto:{E(c.Email)}\" style=\"color:#1D4ED8\">{E(c.Email)}</a>" : "");

        return botones + $@"<p style=""margin:0;padding:14px 16px;background:#F4F7FC;border-radius:10px;font-size:14px;line-height:1.6"">Tu asesor:<br>{datos}</p>";
    }
}
