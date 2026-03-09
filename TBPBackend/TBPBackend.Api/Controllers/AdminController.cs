using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Admin;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AdminController(ApplicationDbContext db)
    {
        _db = db;
    }

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
}

