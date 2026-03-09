using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Patient;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/patient")]
public class PatientController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PatientController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientInfoDto>>> GetAllPatients()
    {
        var patients = await _db.Patients
            .Select(p => new PatientInfoDto
            {
                Id = p.Id,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Email = p.Email,
                Phone = p.Phone,
                Gender = p.Gender,
                DateOfBirth = p.DateOfBirth,
                HasAccessToDiagnosis = p.HasAccessToDiagnosis,
                CreatedAtUtc = p.CreatedAtUtc,
                UpdatedAtUtc = p.UpdatedAtUtc,
                LastLoginAtUtc = p.LastLoginAtUtc
            })
            .ToListAsync();

        return Ok(patients);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<PatientInfoDto>> GetPatientById(long id)
    {
        var patient = await _db.Patients
            .Where(p => p.Id == id)
            .Select(p => new PatientInfoDto
            {
                Id = p.Id,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Email = p.Email,
                Phone = p.Phone,
                Gender = p.Gender,
                DateOfBirth = p.DateOfBirth,
                HasAccessToDiagnosis = p.HasAccessToDiagnosis,
                CreatedAtUtc = p.CreatedAtUtc,
                UpdatedAtUtc = p.UpdatedAtUtc,
                LastLoginAtUtc = p.LastLoginAtUtc
            })
            .FirstOrDefaultAsync();

        if (patient is null) return NotFound();

        return Ok(patient);
    }
}

