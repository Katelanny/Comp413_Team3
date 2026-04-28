using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Dashboard;
using TBPBackend.Api.Dtos.Doctor;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/doctor")]
public class DoctorController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IImageService _imageService;

    public DoctorController(ApplicationDbContext db, IImageService imageService)
    {
        _db = db;
        _imageService = imageService;
    }

    /// Returns the dashboard for the authenticated doctor, including their patient list with last visit dates.
    [HttpGet("dashboard")]
    [Authorize(Policy = "DoctorOnly")]
    public async Task<ActionResult<DoctorDashboardDto>> GetDashboard()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var doctor = await _db.Doctors
            .FirstOrDefaultAsync(d => d.AppUserId == userId);

        if (doctor is null)
            return NotFound(new { error = "No doctor profile found for this account." });

        var patientIds = await _db.Visits
            .Where(v => v.DoctorId == doctor.Id)
            .Select(v => v.PatientId)
            .Distinct()
            .ToListAsync();

        var patients = await _db.Patients
            .Where(p => patientIds.Contains(p.Id))
            .Select(p => new DoctorPatientSummaryDto
            {
                PatientId = p.Id,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Email = p.Email,
                LastVisitDate = _db.Visits
                    .Where(v => v.PatientId == p.Id && v.DoctorId == doctor.Id)
                    .OrderByDescending(v => v.VisitDate)
                    .Select(v => (DateTime?)v.VisitDate)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(new DoctorDashboardDto
        {
            FirstName = doctor.FirstName,
            LastName = doctor.LastName,
            Email = doctor.Email,
            Patients = patients
        });
    }

    /// Returns full details for a patient, including images and lesions. Only accessible if the doctor has a visit with that patient.
    [HttpGet("patients/{patientId:long}")]
    [Authorize(Policy = "DoctorOnly")]
    public async Task<ActionResult<DoctorPatientDetailDto>> GetPatientDetail(long patientId)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.AppUserId == userId);
        if (doctor is null) return NotFound();

        var hasVisit = await _db.Visits.AnyAsync(v => v.DoctorId == doctor.Id && v.PatientId == patientId);
        if (!hasVisit)
            return Forbid();

        var patient = await _db.Patients
            .Include(p => p.Lesions)
            .FirstOrDefaultAsync(p => p.Id == patientId);

        if (patient is null) return NotFound();

        var imageUrls = new List<ImageInfoDto>();
        if (patient.AppUserId != null)
        {
            var urls = await _imageService.GetAllImageUrlsAsync(patient.AppUserId);
            imageUrls = urls.Select(i => new ImageInfoDto
            {
                FileName = i.FileName,
                Url = i.SignedUrl,
                ModelName = i.ModelName,
                Index = i.Index,
                Count = i.Count,
                CameraAngle = i.CameraAngle,
                Height = i.Height,
                Width = i.Width,
                DateTaken = i.DateTaken ?? DateTime.MinValue
            }).ToList();
        }

        return Ok(new DoctorPatientDetailDto
        {
            PatientId = patient.Id,
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            Email = patient.Email,
            Images = imageUrls,
            Lesions = patient.Lesions.Select(l => new LesionInfoDto
            {
                Id = l.Id,
                AnatomicalSite = l.AnatomicalSite,
                Diagnosis = l.Diagnosis,
                NumberOfLesions = l.NumberOfLesions,
                DateRecorded = l.DateRecorded
            }).ToList()
        });
    }

    /// Returns signed image URLs for a patient. Requires a visit relationship between the doctor and the patient.
    [HttpGet("patients/{patientId:long}/images")]
    [Authorize(Policy = "DoctorOnly")]
    public async Task<ActionResult<List<PatientImageDto>>> GetPatientImages(long patientId)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.AppUserId == userId);
        if (doctor is null) return NotFound();

        var hasVisit = await _db.Visits.AnyAsync(v => v.DoctorId == doctor.Id && v.PatientId == patientId);
        if (!hasVisit) return Forbid();

        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
        if (patient is null) return NotFound();

        if (patient.AppUserId is null) return Ok(new List<PatientImageDto>());

        var images = await _imageService.GetAllImageUrlsAsync(patient.AppUserId);

        return Ok(images.Select(i => new PatientImageDto
        {
            ImageId = i.Id,
            Url = i.SignedUrl,
            CameraAngle = i.CameraAngle,
            CreatedAtUtc = i.DateTaken ?? DateTime.MinValue,
        }).ToList());
    }

    /// Returns a list of all doctor profiles. Accessible to medical staff roles.
    [HttpGet]
    [Authorize(Policy = "MedicalStaff")]
    public async Task<ActionResult<IEnumerable<DoctorInfoDto>>> GetAllDoctors()
    {
        var doctors = await _db.Doctors
            .Select(d => new DoctorInfoDto
            {
                Id = d.Id,
                FirstName = d.FirstName,
                LastName = d.LastName,
                Email = d.Email,
                CreatedAtUtc = d.CreatedAtUtc,
                LastLoginAtUtc = d.LastLoginAtUtc
            })
            .ToListAsync();

        return Ok(doctors);
    }

    /// Returns a single doctor profile by ID. Accessible to medical staff roles.
    [HttpGet("{id:long}")]
    [Authorize(Policy = "MedicalStaff")]
    public async Task<ActionResult<DoctorInfoDto>> GetDoctorById(long id)
    {
        var doctor = await _db.Doctors
            .Where(d => d.Id == id)
            .Select(d => new DoctorInfoDto
            {
                Id = d.Id,
                FirstName = d.FirstName,
                LastName = d.LastName,
                Email = d.Email,
                CreatedAtUtc = d.CreatedAtUtc,
                LastLoginAtUtc = d.LastLoginAtUtc
            })
            .FirstOrDefaultAsync();

        if (doctor is null) return NotFound();

        return Ok(doctor);
    }

    /// Grants or revokes a patient's access to view their own diagnosis. Only the treating doctor can change this.
    [HttpPatch("patients/{patientId:long}/diagnosis-access")]
    [Authorize(Policy = "DoctorOnly")]
    public async Task<ActionResult> SetPatientDiagnosisAccess(long patientId, [FromBody] SetDiagnosisAccessDto request)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var doctor = await _db.Doctors.FirstOrDefaultAsync(d => d.AppUserId == userId);
        if (doctor is null) return NotFound(new { error = "No doctor profile found." });

        var hasVisit = await _db.Visits.AnyAsync(v => v.DoctorId == doctor.Id && v.PatientId == patientId);
        if (!hasVisit) return Forbid();

        var patient = await _db.Patients.FirstOrDefaultAsync(p => p.Id == patientId);
        if (patient is null) return NotFound(new { error = "Patient not found." });

        patient.HasAccessToDiagnosis = request.HasAccess;
        await _db.SaveChangesAsync();

        return Ok(new { patientId = patient.Id, hasAccessToDiagnosis = patient.HasAccessToDiagnosis });
    }

    /// Extracts the authenticated user's ID from the JWT claims.
    private string? GetUserId()
    {
        return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}
