using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using TBPBackend.Api.Controllers;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Dashboard;
using TBPBackend.Api.Dtos.Patient;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Tests;

public class PatientControllerTests
{
    private static ApplicationDbContext CreateDb(string name)
    {
        var opts = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new ApplicationDbContext(opts);
    }

    private static ControllerContext MakeContext(string userId)
    {
        var claims = new[] { new Claim("sub", userId) };
        var identity = new ClaimsIdentity(claims, "Test");
        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static ControllerContext EmptyContext() =>
        new() { HttpContext = new DefaultHttpContext() };

    private static Mock<IImageService> EmptyImageService()
    {
        var mock = new Mock<IImageService>();
        mock.Setup(s => s.GetAllImageUrlsAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<ImageUrlResult>());
        return mock;
    }

    // ── GetDashboard ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDashboard_ReturnsUnauthorized_WhenNoClaim()
    {
        using var db = CreateDb(nameof(GetDashboard_ReturnsUnauthorized_WhenNoClaim));
        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetDashboard();
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetDashboard_ReturnsNotFound_WhenNoPatientProfile()
    {
        using var db = CreateDb(nameof(GetDashboard_ReturnsNotFound_WhenNoPatientProfile));
        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("unknown-user")
        };
        var result = await controller.GetDashboard();
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetDashboard_ReturnsOk_WhenPatientExists()
    {
        using var db = CreateDb(nameof(GetDashboard_ReturnsOk_WhenPatientExists));
        db.Patients.Add(new Patient
        {
            AppUserId = "user-1",
            FirstName = "Jane", LastName = "Doe", Email = "jane@example.com",
            Phone = "555-0001", Gender = "F", DateOfBirth = "1990-01-01",
            HasAccessToDiagnosis = true
        });
        await db.SaveChangesAsync();

        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("user-1")
        };
        var result = await controller.GetDashboard();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PatientDashboardDto>(ok.Value);
        Assert.Equal("Jane", dto.FirstName);
        Assert.Equal("Doe", dto.LastName);
        Assert.True(dto.HasAccessToDiagnosis);
    }

    [Fact]
    public async Task GetDashboard_ExposesImages_FromImageService()
    {
        using var db = CreateDb(nameof(GetDashboard_ExposesImages_FromImageService));
        db.Patients.Add(new Patient
        {
            AppUserId = "user-2",
            FirstName = "Bob", LastName = "Smith", Email = "bob@example.com",
            Phone = "555-0002", Gender = "M", DateOfBirth = "1985-05-05",
            HasAccessToDiagnosis = false
        });
        await db.SaveChangesAsync();

        var imageService = new Mock<IImageService>();
        imageService.Setup(s => s.GetAllImageUrlsAsync("user-2"))
            .ReturnsAsync(new List<ImageUrlResult>
            {
                new(1, "photo.jpg", "https://signed.url/photo.jpg")
            });

        var controller = new PatientController(db, imageService.Object)
        {
            ControllerContext = MakeContext("user-2")
        };
        var result = await controller.GetDashboard();

        var dto = Assert.IsType<PatientDashboardDto>(((OkObjectResult)result.Result!).Value);
        Assert.Single(dto.Images);
        Assert.Equal("photo.jpg", dto.Images[0].FileName);
    }

    // ── GetAllPatients ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllPatients_ReturnsOk_WithAllPatients()
    {
        using var db = CreateDb(nameof(GetAllPatients_ReturnsOk_WithAllPatients));
        db.Patients.AddRange(
            new Patient { FirstName = "A", LastName = "B", Email = "a@b.com", Phone = "1", Gender = "M", DateOfBirth = "2000-01-01", HasAccessToDiagnosis = false },
            new Patient { FirstName = "C", LastName = "D", Email = "c@d.com", Phone = "2", Gender = "F", DateOfBirth = "2001-01-01", HasAccessToDiagnosis = true });
        await db.SaveChangesAsync();

        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetAllPatients();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<PatientInfoDto>>(ok.Value);
        Assert.Equal(2, list.Count());
    }

    // ── GetPatientById ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPatientById_ReturnsNotFound_WhenMissing()
    {
        using var db = CreateDb(nameof(GetPatientById_ReturnsNotFound_WhenMissing));
        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetPatientById(9999);
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetPatientById_ReturnsOk_WhenFound()
    {
        using var db = CreateDb(nameof(GetPatientById_ReturnsOk_WhenFound));
        db.Patients.Add(new Patient
        {
            Id = 1,
            FirstName = "Alice", LastName = "Wonder", Email = "alice@example.com",
            Phone = "555-9999", Gender = "F", DateOfBirth = "1995-03-15",
            HasAccessToDiagnosis = false
        });
        await db.SaveChangesAsync();

        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetPatientById(1);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PatientInfoDto>(ok.Value);
        Assert.Equal("Alice", dto.FirstName);
        Assert.Equal("alice@example.com", dto.Email);
    }

    // ── GetDoctorNotes ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDoctorNotes_ReturnsNotFound_WhenPatientMissing()
    {
        using var db = CreateDb(nameof(GetDoctorNotes_ReturnsNotFound_WhenPatientMissing));
        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("nobody")
        };
        var result = await controller.GetDoctorNotes();
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetDoctorNotes_ReturnsForbid_WhenNoAccessToDiagnosis()
    {
        using var db = CreateDb(nameof(GetDoctorNotes_ReturnsForbid_WhenNoAccessToDiagnosis));
        db.Patients.Add(new Patient
        {
            AppUserId = "user-3",
            FirstName = "X", LastName = "Y", Email = "x@y.com",
            Phone = "1", Gender = "M", DateOfBirth = "1990-01-01",
            HasAccessToDiagnosis = false
        });
        await db.SaveChangesAsync();

        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("user-3")
        };
        var result = await controller.GetDoctorNotes();
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task GetDoctorNotes_ReturnsOk_WhenHasAccess()
    {
        using var db = CreateDb(nameof(GetDoctorNotes_ReturnsOk_WhenHasAccess));

        var patient = new Patient
        {
            Id = 10, AppUserId = "user-4",
            FirstName = "P", LastName = "Q", Email = "p@q.com",
            Phone = "1", Gender = "F", DateOfBirth = "1992-02-02",
            HasAccessToDiagnosis = true
        };
        var doctor = new Doctor
        {
            Id = 20, FirstName = "Dr", LastName = "House", Email = "house@hospital.com"
        };
        db.Patients.Add(patient);
        db.Doctors.Add(doctor);
        await db.SaveChangesAsync();

        db.Visits.Add(new Visits
        {
            PatientId = 10, DoctorId = 20,
            VisitDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            VisitNotes = "Routine check-up"
        });
        await db.SaveChangesAsync();

        var controller = new PatientController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("user-4")
        };
        var result = await controller.GetDoctorNotes();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var notes = Assert.IsType<List<DoctorNoteDto>>(ok.Value);
        Assert.Single(notes);
        Assert.Equal("Routine check-up", notes[0].VisitNotes);
        Assert.Equal("Dr", notes[0].DoctorFirstName);
    }
}
