using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
using LegalManagementSystem.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace LegalManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAlmacenamientoArchivos _almacenamiento;

    public DocumentosController(ApplicationDbContext context, IAlmacenamientoArchivos almacenamiento)
    {
        _context = context;
        _almacenamiento = almacenamiento;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocumentos([FromQuery] int? expedienteId)
    {
        var query = _context.Documentos.AsQueryable();
        if (expedienteId.HasValue)
            query = query.Where(d => d.ExpedienteId == expedienteId.Value);

        var documentos = await query.OrderByDescending(d => d.FechaSubida).ToListAsync();
        return Ok(documentos);
    }

    [HttpPost]
    public async Task<IActionResult> UploadDocumento([FromForm] IFormFile file, [FromForm] int expedienteId, [FromForm] string? descripcion)
    {
        var expedienteExiste = await _context.Expedientes.AnyAsync(e => e.Id == expedienteId);
        if (!expedienteExiste) return BadRequest($"No existe un expediente con id {expedienteId}");

        if (file == null || file.Length == 0) return BadRequest("Archivo inválido");

        // Path.GetFileName: el nombre que manda el navegador no puede traer carpetas
        var nombreInterno = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";

        await using (var stream = file.OpenReadStream())
        {
            await _almacenamiento.GuardarAsync(nombreInterno, stream, file.ContentType);
        }

        var documento = new Documento
        {
            NombreOriginal = file.FileName,
            NombreArchivoInterno = nombreInterno,
            TipoContenido = file.ContentType,
            Descripcion = descripcion,
            ExpedienteId = expedienteId,
        };

        _context.Documentos.Add(documento);
        await _context.SaveChangesAsync();

        return Ok(documento);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var documento = await _context.Documentos.FindAsync(id);
        if (documento == null) return NotFound();

        var stream = await _almacenamiento.AbrirAsync(documento.NombreArchivoInterno);
        if (stream == null) return NotFound("El archivo no se encuentra en el servidor");

        return File(stream, documento.TipoContenido, documento.NombreOriginal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocumento(int id)
    {
        var documento = await _context.Documentos.FindAsync(id);
        if (documento == null) return NotFound();

        await _almacenamiento.BorrarAsync(documento.NombreArchivoInterno);

        _context.Documentos.Remove(documento);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
