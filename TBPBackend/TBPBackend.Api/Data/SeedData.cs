using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        await CreateRoles(roleManager);

        var patient1User = await EnsureUser(userManager, "patient1", "patient1", "patient1@tbp.com", "Patient");
        var patient2User = await EnsureUser(userManager, "patient2", "patient2", "patient2@tbp.com", "Patient");
        var doctorUser   = await EnsureUser(userManager, "doctor",   "doctor",   "doctor@tbp.com",   "Doctor");
        var adminUser    = await EnsureUser(userManager, "admin",    "admin123", "admin@tbp.com",    "Admin");

        var patient1 = await EnsurePatient(db, patient1User.Id, "Alice",  "Johnson", "patient1@tbp.com",
            "555-0101", "Female", "1985-06-15", hasAccessToDiagnosis: true);

        var patient2 = await EnsurePatient(db, patient2User.Id, "Bob",    "Williams","patient2@tbp.com",
            "555-0102", "Male",   "1990-11-20", hasAccessToDiagnosis: false);

        var doctor = await EnsureDoctor(db, doctorUser.Id, "Dr. Sarah", "Chen", "doctor@tbp.com");
        var admin  = await EnsureAdmin(db, adminUser.Id,   "System",    "Admin", "admin@tbp.com");

        await EnsureLesions(db, patient1.Id, new[]
        {
            ("Left forearm",  "Benign melanocytic nevus",       2, new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc)),
            ("Upper back",    "Basal cell carcinoma",           1, new DateTime(2026, 2, 5, 0, 0, 0, DateTimeKind.Utc)),
            ("Right shoulder","Seborrheic keratosis",           3, new DateTime(2026, 2, 20, 0, 0, 0, DateTimeKind.Utc)),
        });

        await EnsureLesions(db, patient2.Id, new[]
        {
            ("Right hand",    "Actinic keratosis",              1, new DateTime(2026, 1, 22, 0, 0, 0, DateTimeKind.Utc)),
            ("Left leg",      "Dermatofibroma",                 2, new DateTime(2026, 2, 12, 0, 0, 0, DateTimeKind.Utc)),
            ("Chest",         "Squamous cell carcinoma in situ",1, new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc)),
        });

        await EnsureImages(db, patient1User.Id, new[]
        {
            ("model_000_WMale.png", new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc)),
            ("model_001_WMale.png", new DateTime(2026, 2, 5, 0, 0, 0, DateTimeKind.Utc)),
            ("model_002_WMale.png", new DateTime(2026, 2, 20, 0, 0, 0, DateTimeKind.Utc)),
        });

        await EnsureImages(db, patient2User.Id, new[]
        {
            ("model_002_WMale.png", new DateTime(2026, 1, 22, 0, 0, 0, DateTimeKind.Utc)),
            ("model_003_WMale.png", new DateTime(2026, 2, 12, 0, 0, 0, DateTimeKind.Utc)),
            ("model_000_WMale.png", new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc)),
        });

        await EnsureVisits(db, patient1.Id, doctor.Id, new[]
        {
            (new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc), "Initial skin screening. Three lesions identified."),
            (new DateTime(2026, 2, 20, 0, 0, 0, DateTimeKind.Utc), "Follow-up on biopsy results."),
        });

        await EnsureVisits(db, patient2.Id, doctor.Id, new[]
        {
            (new DateTime(2026, 1, 22, 0, 0, 0, DateTimeKind.Utc), "Referred for dermatology consult."),
            (new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),  "Chest lesion evaluation."),
        });
    }

    private static async Task CreateRoles(RoleManager<IdentityRole> roleManager)
    {
        string[] roles = ["Patient", "Doctor", "Admin"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    private static async Task<AppUser> EnsureUser(
        UserManager<AppUser> userManager, string username, string password, string email, string role)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user != null) return user;

        user = new AppUser { UserName = username, Email = email };
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new Exception($"Failed to create user '{username}': {string.Join(", ", result.Errors.Select(e => e.Description))}");

        await userManager.AddToRoleAsync(user, role);
        return user;
    }

    private static async Task<Patient> EnsurePatient(
        ApplicationDbContext db, string appUserId, string firstName, string lastName,
        string email, string phone, string gender, string dob, bool hasAccessToDiagnosis)
    {
        var existing = await db.Patients.FirstOrDefaultAsync(p => p.AppUserId == appUserId);
        if (existing != null) return existing;

        var patient = new Patient
        {
            AppUserId = appUserId,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Phone = phone,
            Gender = gender,
            DateOfBirth = dob,
            HasAccessToDiagnosis = hasAccessToDiagnosis,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
            LastLoginAtUtc = DateTime.UtcNow
        };
        db.Patients.Add(patient);
        await db.SaveChangesAsync();
        return patient;
    }

    private static async Task<Doctor> EnsureDoctor(
        ApplicationDbContext db, string appUserId, string firstName, string lastName, string email)
    {
        var existing = await db.Doctors.FirstOrDefaultAsync(d => d.AppUserId == appUserId);
        if (existing != null) return existing;

        var doctor = new Doctor
        {
            AppUserId = appUserId,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            CreatedAtUtc = DateTime.UtcNow,
            LastLoginAtUtc = DateTime.UtcNow
        };
        db.Doctors.Add(doctor);
        await db.SaveChangesAsync();
        return doctor;
    }

    private static async Task<Admin> EnsureAdmin(
        ApplicationDbContext db, string appUserId, string firstName, string lastName, string email)
    {
        var existing = await db.Admins.FirstOrDefaultAsync(a => a.AppUserId == appUserId);
        if (existing != null) return existing;

        var admin = new Admin
        {
            AppUserId = appUserId,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            CreatedAtUtc = DateTime.UtcNow,
            LastLoginAtUtc = DateTime.UtcNow
        };
        db.Admins.Add(admin);
        await db.SaveChangesAsync();
        return admin;
    }

    private static async Task EnsureLesions(
        ApplicationDbContext db, long patientId, (string site, string diagnosis, int count, DateTime date)[] lesions)
    {
        var existingCount = await db.Lesions.CountAsync(l => l.PatientId == patientId);
        if (existingCount > 0) return;

        foreach (var (site, diagnosis, count, date) in lesions)
        {
            db.Lesions.Add(new Lesion
            {
                PatientId = patientId,
                AnatomicalSite = site,
                Diagnosis = diagnosis,
                NumberOfLesions = count,
                DateRecorded = date,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task EnsureImages(
        ApplicationDbContext db, string appUserId, (string fileName, DateTime date)[] images)
    {
        var existingCount = await db.UserImages.CountAsync(i => i.AppUserId == appUserId);
        if (existingCount > 0) return;

        foreach (var (fileName, date) in images)
        {
            db.UserImages.Add(new UserImage
            {
                AppUserId = appUserId,
                FileName = fileName,
                CreatedAtUtc = date
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task EnsureVisits(
        ApplicationDbContext db, long patientId, long doctorId, (DateTime date, string notes)[] visits)
    {
        var existingCount = await db.Visits.CountAsync(v => v.PatientId == patientId && v.DoctorId == doctorId);
        if (existingCount > 0) return;

        foreach (var (date, notes) in visits)
        {
            db.Visits.Add(new Visits
            {
                PatientId = patientId,
                DoctorId = doctorId,
                VisitDate = date,
                VisitNotes = notes
            });
        }
        await db.SaveChangesAsync();
    }
}
