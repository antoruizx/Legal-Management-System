namespace LegalManagementSystem.Api.Services;

// Dónde se guardan los documentos subidos. En desarrollo, una carpeta local;
// en producción, un bucket de Google Cloud Storage (el disco de Cloud Run se borra).
public interface IAlmacenamientoArchivos
{
    Task GuardarAsync(string nombre, Stream contenido, string tipoContenido);

    // null si el archivo no existe
    Task<Stream?> AbrirAsync(string nombre);

    // No falla si el archivo ya no existe
    Task BorrarAsync(string nombre);
}
