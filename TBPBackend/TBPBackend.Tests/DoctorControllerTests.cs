using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using TBPBackend.Api.Controllers;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Dashboard;
using TBPBackend.Api.Dtos.Doctor;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Tests;

public class DoctorControllerTests
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
        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetDashboard();
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task GetDashboard_ReturnsNotFound_WhenNoDoctorProfile()
    {
        using var db = CreateDb(nameof(GetDashboard_ReturnsNotFound_WhenNoDoctorProfile));
        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("unknown-doc")
        };
        var result = await controller.GetDashboard();
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task GetDashboard_ReturnsOk_WithPatientsFromVisits()
    {
        using var db = CreateDb(nameof(GetDashboard_ReturnsOk_WithPatientsFromVisits));

        var doctor = new Doctor
        {
            Id = 1, AppUserId = "doc-user-1",
            FirstName = "Gregory", LastName = "House", Email = "house@hospital.com"
        };
        var patient = new Patient
        {
            Id = 1,
            FirstName = "John", LastName = "Doe", Email = "john@example.com",
            Phone = "555-1111", Gender = "M", DateOfBirth = "1980-06-01",
            HasAccessToDiagnosis = false
        };
        db.Doctors.Add(doctor);
        db.Patients.Add(patient);
        await db.SaveChangesAsync();

        db.Visits.Add(new Visits
        {
            PatientId = 1, DoctorId = 1,
            VisitDate = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
            VisitNotes = "Follow-up"
        });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-user-1")
        };
        var result = await controller.GetDashboard();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<DoctorDashboardDto>(ok.Value);
        Assert.Equal("Gregory", dto.FirstName);
        Assert.Single(dto.Patients);
        Assert.Equal("John", dto.Patients[0].FirstName);
    }

    // ── GetPatientDetail ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetPatientDetail_ReturnsNotFound_WhenNoDoctorProfile()
    {
        using var db = CreateDb(nameof(GetPatientDetail_ReturnsNotFound_WhenNoDoctorProfile));
        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("not-a-doctor")
        };
        var result = await controller.GetPatientDetail(1);
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetPatientDetail_ReturnsForbid_WhenNoVisitRelationship()
    {
        using var db = CreateDb(nameof(GetPatientDetail_ReturnsForbid_WhenNoVisitRelationship));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-2", FirstName = "D", LastName = "L", Email = "d@l.com" });
        db.Patients.Add(new Patient { Id = 1, FirstName = "P", LastName = "Q", Email = "p@q.com", Phone = "1", Gender = "M", DateOfBirth = "1990-01-01" });
        await db.SaveChangesAsync();

        // No visit between doctor 1 and patient 1
        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-2")
        };
        var result = await controller.GetPatientDetail(1);
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task GetPatientDetail_ReturnsOk_WhenVisitRelationshipExists()
    {
        using var db = CreateDb(nameof(GetPatientDetail_ReturnsOk_WhenVisitRelationshipExists));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-3", FirstName = "Sarah", LastName = "Connor", Email = "s@c.com" });
        db.Patients.Add(new Patient { Id = 1, FirstName = "Miles", LastName = "Davis", Email = "miles@jazz.com", Phone = "1", Gender = "M", DateOfBirth = "1970-05-26" });
        await db.SaveChangesAsync();

        db.Visits.Add(new Visits { PatientId = 1, DoctorId = 1, VisitDate = DateTime.UtcNow, VisitNotes = "Initial" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-3")
        };
        var result = await controller.GetPatientDetail(1);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<DoctorPatientDetailDto>(ok.Value);
        Assert.Equal("Miles", dto.FirstName);
        Assert.Equal("miles@jazz.com", dto.Email);
    }

    // ── GetPatientImages ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetPatientImages_ReturnsForbid_WhenNoVisit()
    {
        using var db = CreateDb(nameof(GetPatientImages_ReturnsForbid_WhenNoVisit));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-4", FirstName = "D", LastName = "R", Email = "dr@dr.com" });
        db.Patients.Add(new Patient { Id = 1, FirstName = "Q", LastName = "W", Email = "q@w.com", Phone = "1", Gender = "F", DateOfBirth = "1990-01-01" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-4")
        };
        var result = await controller.GetPatientImages(1);
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task GetPatientImages_ReturnsOk_WithImages()
    {
        using var db = CreateDb(nameof(GetPatientImages_ReturnsOk_WithImages));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-5", FirstName = "D", LastName = "R", Email = "dr@dr.com" });
        db.Patients.Add(new Patient { Id = 1, AppUserId = "patient-app-user", FirstName = "Q", LastName = "W", Email = "q@w.com", Phone = "1", Gender = "F", DateOfBirth = "1990-01-01" });
        await db.SaveChangesAsync();

        db.Visits.Add(new Visits { PatientId = 1, DoctorId = 1, VisitDate = DateTime.UtcNow, VisitNotes = "Check" });
        await db.SaveChangesAsync();

        var taken = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        var imageService = new Mock<IImageService>();
        imageService.Setup(s => s.GetAllImageUrlsAsync("patient-app-user"))
            .ReturnsAsync(new List<ImageUrlResult>
            {
                new(42, "scan.jpg", "https://gcs.url/scan.jpg", DateTaken: taken)
            });

        var controller = new DoctorController(db, imageService.Object)
        {
            ControllerContext = MakeContext("doc-5")
        };
        var result = await controller.GetPatientImages(1);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var images = Assert.IsType<List<PatientImageDto>>(ok.Value);
        Assert.Single(images);
        Assert.Equal(42, images[0].ImageId);
        Assert.Equal("https://gcs.url/scan.jpg", images[0].Url);
        Assert.Equal(taken, images[0].CreatedAtUtc);
    }

    // ── GetAllDoctors ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllDoctors_ReturnsOk_WithDoctorList()
    {
        using var db = CreateDb(nameof(GetAllDoctors_ReturnsOk_WithDoctorList));
        db.Doctors.AddRange(
            new Doctor { FirstName = "A", LastName = "B", Email = "a@b.com" },
            new Doctor { FirstName = "C", LastName = "D", Email = "c@d.com" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetAllDoctors();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsAssignableFrom<IEnumerable<DoctorInfoDto>>(ok.Value);
        Assert.Equal(2, list.Count());
    }

    // ── GetDoctorById ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDoctorById_ReturnsNotFound_WhenMissing()
    {
        using var db = CreateDb(nameof(GetDoctorById_ReturnsNotFound_WhenMissing));
        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetDoctorById(9999);
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetDoctorById_ReturnsOk_WhenFound()
    {
        using var db = CreateDb(nameof(GetDoctorById_ReturnsOk_WhenFound));
        db.Doctors.Add(new Doctor { Id = 7, FirstName = "Gregory", LastName = "House", Email = "house@ppth.com" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = EmptyContext()
        };
        var result = await controller.GetDoctorById(7);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<DoctorInfoDto>(ok.Value);
        Assert.Equal("Gregory", dto.FirstName);
        Assert.Equal("house@ppth.com", dto.Email);
    }

    // ── SetPatientDiagnosisAccess ─────────────────────────────────────────────

    [Fact]
    public async Task SetPatientDiagnosisAccess_ReturnsForbid_WhenNoVisit()
    {
        using var db = CreateDb(nameof(SetPatientDiagnosisAccess_ReturnsForbid_WhenNoVisit));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-x", FirstName = "D", LastName = "R", Email = "dr@dr.com" });
        db.Patients.Add(new Patient { Id = 1, FirstName = "P", LastName = "T", Email = "pt@pt.com", Phone = "1", Gender = "M", DateOfBirth = "1990-01-01" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-x")
        };
        var result = await controller.SetPatientDiagnosisAccess(1, new SetDiagnosisAccessDto { HasAccess = true });
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task SetPatientDiagnosisAccess_UpdatesFlag_WhenVisitExists()
    {
        using var db = CreateDb(nameof(SetPatientDiagnosisAccess_UpdatesFlag_WhenVisitExists));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-y", FirstName = "D", LastName = "R", Email = "dr@dr.com" });
        db.Patients.Add(new Patient { Id = 1, FirstName = "P", LastName = "T", Email = "pt@pt.com", Phone = "1", Gender = "M", DateOfBirth = "1990-01-01", HasAccessToDiagnosis = false });
        await db.SaveChangesAsync();

        db.Visits.Add(new Visits { PatientId = 1, DoctorId = 1, VisitDate = DateTime.UtcNow, VisitNotes = "Init" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-y")
        };
        var result = await controller.SetPatientDiagnosisAccess(1, new SetDiagnosisAccessDto { HasAccess = true });

        Assert.IsType<OkObjectResult>(result);
        var patient = await db.Patients.FindAsync(1L);
        Assert.True(patient!.HasAccessToDiagnosis);
    }

    [Fact]
    public async Task SetPatientDiagnosisAccess_CanRevokeAccess()
    {
        using var db = CreateDb(nameof(SetPatientDiagnosisAccess_CanRevokeAccess));
        db.Doctors.Add(new Doctor { Id = 1, AppUserId = "doc-z", FirstName = "D", LastName = "R", Email = "dr@dr.com" });
        db.Patients.Add(new Patient { Id = 1, FirstName = "P", LastName = "T", Email = "pt@pt.com", Phone = "1", Gender = "M", DateOfBirth = "1990-01-01", HasAccessToDiagnosis = true });
        await db.SaveChangesAsync();

        db.Visits.Add(new Visits { PatientId = 1, DoctorId = 1, VisitDate = DateTime.UtcNow, VisitNotes = "Init" });
        await db.SaveChangesAsync();

        var controller = new DoctorController(db, EmptyImageService().Object)
        {
            ControllerContext = MakeContext("doc-z")
        };
        await controller.SetPatientDiagnosisAccess(1, new SetDiagnosisAccessDto { HasAccess = false });

        var patient = await db.Patients.FindAsync(1L);
        Assert.False(patient!.HasAccessToDiagnosis);
    }
}
