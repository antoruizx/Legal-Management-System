using LegalManagementSystem.Api.Data;
using LegalManagementSystem.Api.Models;
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
    private readonly string _uploadsFolder;

    public DocumentosController(ApplicationDbContext context)
    {
        _context = context;
        _uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(_uploadsFolder))
            Directory.CreateDirectory(_uploadsFolder);
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

        var nombreInterno = $"{Guid.NewGuid()}_{file.FileName}";
        var rutaCompleta = Path.Combine(_uploadsFolder, nombreInterno);

        using (var stream = new FileStream(rutaCompleta, FileMode.Create))
        {
            await file.CopyToAsync(stream);
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

        var rutaCompleta = Path.Combine(_uploadsFolder, documento.NombreArchivoInterno);
        if (!System.IO.File.Exists(rutaCompleta)) return NotFound("El archivo no se encuentra en el servidor");

        var bytes = await System.IO.File.ReadAllBytesAsync(rutaCompleta);
        return File(bytes, documento.TipoContenido, documento.NombreOriginal);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocumento(int id)
    {
        var documento = await _context.Documentos.FindAsync(id);
        if (documento == null) return NotFound();

        var rutaCompleta = Path.Combine(_uploadsFolder, documento.NombreArchivoInterno);
        if (System.IO.File.Exists(rutaCompleta))
            System.IO.File.Delete(rutaCompleta);

        _context.Documentos.Remove(documento);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}