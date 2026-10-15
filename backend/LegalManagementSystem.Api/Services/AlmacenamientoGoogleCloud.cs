using Google;
using Google.Cloud.Storage.V1;
using System.Net;

namespace LegalManagementSystem.Api.Services;

// Guarda los archivos en un bucket de Google Cloud Storage (Almacenamiento:Bucket).
// En Cloud Run se autentica solo con la cuenta de servicio del servicio: no hace falta clave.
public class AlmacenamientoGoogleCloud : IAlmacenamientoArchivos
{
    private readonly StorageClient _cliente;
    private readonly string _bucket;

    public AlmacenamientoGoogleCloud(string bucket)
    {
        _cliente = StorageClient.Create();
        _bucket = bucket;
    }

    public async Task GuardarAsync(string nombre, Stream contenido, string tipoContenido)
    {
        await _cliente.UploadObjectAsync(_bucket, nombre, tipoContenido, contenido);
    }

    public async Task<Stream?> AbrirAsync(string nombre)
    {
        var memoria = new MemoryStream();
        try
        {
            await _cliente.DownloadObjectAsync(_bucket, nombre, memoria);
        }
        catch (GoogleApiException e) when (e.HttpStatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
        memoria.Position = 0;
        return memoria;
    }

    public async Task BorrarAsync(string nombre)
    {
        try
        {
            await _cliente.DeleteObjectAsync(_bucket, nombre);
        }
        catch (GoogleApiException e) when (e.HttpStatusCode == HttpStatusCode.NotFound)
        {
            // ya no estaba
        }
    }
}
