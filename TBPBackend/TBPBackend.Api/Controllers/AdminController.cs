using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Admin;
using TBPBackend.Api.Dtos.Dashboard;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AdminController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// Returns the admin dashboard with all users grouped by role and the 10 most recent visits.
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var admin = await _db.Admins.FirstOrDefaultAsync(a => a.AppUserId == userId);
        if (admin is null)
            return NotFound(new { error = "No admin profile found for this account." });

        var patients = await _db.Patients
            .Select(p => new AdminUserInfoDto
            {
                Id = p.Id,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Email = p.Email,
                Role = "Patient",
                CreatedAtUtc = p.CreatedAtUtc,
                LastLoginAtUtc = p.LastLoginAtUtc
            }).ToListAsync();

        var doctors = await _db.Doctors
            .Select(d => new AdminUserInfoDto
            {
                Id = d.Id,
                FirstName = d.FirstName,
                LastName = d.LastName,
                Email = d.Email,
                Role = "Doctor",
                CreatedAtUtc = d.CreatedAtUtc,
                LastLoginAtUtc = d.LastLoginAtUtc
            }).ToListAsync();

        var admins = await _db.Admins
            .Select(a => new AdminUserInfoDto
            {
                Id = a.Id,
                FirstName = a.FirstName,
                LastName = a.LastName,
                Email = a.Email,
                Role = "Admin",
                CreatedAtUtc = a.CreatedAtUtc,
                LastLoginAtUtc = a.LastLoginAtUtc
            }).ToListAsync();

        var recentVisits = await _db.Visits
            .OrderByDescending(v => v.VisitDate)
            .Take(10)
            .Include(v => v.Patient)
            .Include(v => v.Doctor)
            .Select(v => new ActivityDto
            {
                Type = "Visit",
                UserName = v.Patient.FirstName + " " + v.Patient.LastName +
                           " with Dr. " + v.Doctor.FirstName + " " + v.Doctor.LastName,
                Timestamp = v.VisitDate
            })
            .ToListAsync();

        return Ok(new AdminDashboardDto
        {
            FirstName = admin.FirstName,
            LastName = admin.LastName,
            Email = admin.Email,
            Users = new AdminUsersDto
            {
                TotalUsers = patients.Count + doctors.Count + admins.Count,
                Patients = patients,
                Doctors = doctors,
                Admins = admins
            },
            RecentActivity = recentVisits
        });
    }

    /// Returns a list of all admin profiles.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminInfoDto>>> GetAllAdmins()
    {
        var admins = await _db.Admins
            .Select(a => new AdminInfoDto
            {
                Id = a.Id,
                FirstName = a.FirstName,
                LastName = a.LastName,
                Email = a.Email,
                CreatedAtUtc = a.CreatedAtUtc,
                LastLoginAtUtc = a.LastLoginAtUtc
            })
            .ToListAsync();

        return Ok(admins);
    }

    /// Returns a single admin profile by ID.
    [HttpGet("{id:long}")]
    public async Task<ActionResult<AdminInfoDto>> GetAdminById(long id)
    {
        var admin = await _db.Admins
            .Where(a => a.Id == id)
            .Select(a => new AdminInfoDto
            {
                Id = a.Id,
                FirstName = a.FirstName,
                LastName = a.LastName,
                Email = a.Email,
                CreatedAtUtc = a.CreatedAtUtc,
                LastLoginAtUtc = a.LastLoginAtUtc
            })
            .FirstOrDefaultAsync();

        if (admin is null) return NotFound();

        return Ok(admin);
    }

    /// Extracts the authenticated user's ID from the JWT claims.
    private string? GetUserId()
    {
        return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}
