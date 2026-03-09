using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Doctor;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/doctor")]
public class DoctorController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DoctorController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
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
}

