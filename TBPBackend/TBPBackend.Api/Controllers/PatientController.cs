using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Dashboard;
using TBPBackend.Api.Dtos.Patient;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/patient")]
public class PatientController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IImageService _imageService;

    public PatientController(ApplicationDbContext db, IImageService imageService)
    {
        _db = db;
        _imageService = imageService;
    }

    [HttpGet("dashboard")]
    [Authorize(Policy = "PatientOnly")]
    public async Task<ActionResult<PatientDashboardDto>> GetDashboard()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var patient = await _db.Patients
            .Include(p => p.Lesions)
            .FirstOrDefaultAsync(p => p.AppUserId == userId);

        if (patient is null)
            return NotFound(new { error = "No patient profile found for this account." });

        var imageUrls = await _imageService.GetAllImageUrlsAsync(userId);

        var dashboard = new PatientDashboardDto
        {
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            Email = patient.Email,
            HasAccessToDiagnosis = patient.HasAccessToDiagnosis,
            Images = imageUrls.Select(i => new ImageInfoDto
            {
                FileName = i.FileName,
                Url = i.SignedUrl,
                DateTaken = _db.UserImages
                    .Where(ui => ui.AppUserId == userId && ui.FileName == i.FileName)
                    .Select(ui => ui.CreatedAtUtc)
                    .FirstOrDefault()
            }).ToList(),
            Lesions = patient.Lesions.Select(l => new LesionInfoDto
            {
                Id = l.Id,
                AnatomicalSite = l.AnatomicalSite,
                Diagnosis = patient.HasAccessToDiagnosis ? l.Diagnosis : null,
                NumberOfLesions = l.NumberOfLesions,
                DateRecorded = l.DateRecorded
            }).ToList()
        };

        return Ok(dashboard);
    }

    [HttpGet]
    [Authorize(Policy = "MedicalStaff")]
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
    [Authorize(Policy = "MedicalStaff")]
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

    [HttpGet("doctor-notes")]
    [Authorize(Policy = "PatientOnly")]
    public async Task<ActionResult<List<DoctorNoteDto>>> GetDoctorNotes()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var patient = await _db.Patients
            .FirstOrDefaultAsync(p => p.AppUserId == userId);

        if (patient is null)
            return NotFound(new { error = "No patient profile found for this account." });

        if (!patient.HasAccessToDiagnosis)
            return Forbid();

        var doctorNotes = await _db.Visits
            .Include(v => v.Doctor)
            .Where(v => v.PatientId == patient.Id)
            .OrderByDescending(v => v.VisitDate)
            .Select(v => new DoctorNoteDto
            {
                VisitId = v.Id,
                VisitDate = v.VisitDate,
                DoctorFirstName = v.Doctor.FirstName,
                DoctorLastName = v.Doctor.LastName,
                VisitNotes = v.VisitNotes
            })
            .ToListAsync();

        return Ok(doctorNotes);
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}
