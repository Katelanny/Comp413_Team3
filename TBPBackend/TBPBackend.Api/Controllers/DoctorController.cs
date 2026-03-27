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
                DateTaken = _db.UserImages
                    .Where(ui => ui.AppUserId == patient.AppUserId && ui.FileName == i.FileName)
                    .Select(ui => ui.CreatedAtUtc)
                    .FirstOrDefault()
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

    private string? GetUserId()
    {
        return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}
