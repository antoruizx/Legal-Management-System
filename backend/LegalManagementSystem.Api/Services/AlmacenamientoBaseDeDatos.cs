using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LegalManagementSystem.Api.Services;

// Guarda los archivos en la tabla ArchivosGuardados. Sirve para hosting gratis sin disco
// persistente ni almacenamiento de objetos; el límite es el tamaño de la base.
public class AlmacenamientoBaseDeDatos : IAlmacenamientoArchivos
{
    private readonly ApplicationDbContext _context;

    public AlmacenamientoBaseDeDatos(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task GuardarAsync(string nombre, Stream contenido, string tipoContenido)
    {
        using var memoria = new MemoryStream();
        await contenido.CopyToAsync(memoria);

        _context.ArchivosGuardados.Add(new ArchivoGuardado
        {
            Nombre = nombre,
            TipoContenido = tipoContenido,
            Contenido = memoria.ToArray()
        });
        await _context.SaveChangesAsync();
    }

    public async Task<Stream?> AbrirAsync(string nombre)
    {
        var contenido = await _context.ArchivosGuardados
            .Where(a => a.Nombre == nombre)
            .Select(a => a.Contenido)
            .FirstOrDefaultAsync();
        return contenido == null ? null : new MemoryStream(contenido);
    }

    public async Task BorrarAsync(string nombre)
    {
        // Sin cargar el contenido en memoria
        await _context.ArchivosGuardados.Where(a => a.Nombre == nombre).ExecuteDeleteAsync();
    }
}
