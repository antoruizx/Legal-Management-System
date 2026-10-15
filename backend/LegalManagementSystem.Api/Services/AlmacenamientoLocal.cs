namespace LegalManagementSystem.Api.Services;

// Guarda los archivos en la carpeta Uploads/ junto al proceso. Solo para desarrollo.
public class AlmacenamientoLocal : IAlmacenamientoArchivos
{
    private readonly string _carpeta;

    public AlmacenamientoLocal()
    {
        _carpeta = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        Directory.CreateDirectory(_carpeta);
    }

    public async Task GuardarAsync(string nombre, Stream contenido, string tipoContenido)
    {
        await using var archivo = new FileStream(Ruta(nombre), FileMode.Create);
        await contenido.CopyToAsync(archivo);
    }

    public Task<Stream?> AbrirAsync(string nombre)
    {
        var ruta = Ruta(nombre);
        Stream? stream = File.Exists(ruta) ? File.OpenRead(ruta) : null;
        return Task.FromResult(stream);
    }

    public Task BorrarAsync(string nombre)
    {
        var ruta = Ruta(nombre);
        if (File.Exists(ruta)) File.Delete(ruta);
        return Task.CompletedTask;
    }

    // Path.GetFileName evita que un nombre con ".." salga de la carpeta
    private string Ruta(string nombre) => Path.Combine(_carpeta, Path.GetFileName(nombre));
}
