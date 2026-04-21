using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Data;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
        
    }
    
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<Patient> Patients { get; set; } = null!;
    public DbSet<Doctor> Doctors { get; set; } = null!;
    public DbSet<Admin> Admins { get; set; } = null!;
    public DbSet<Visits> Visits { get; set; } = null!;
    public DbSet<UserImage> UserImages { get; set; } = null!;
    public DbSet<Lesion> Lesions { get; set; } = null!;
    public DbSet<ImagePrediction> ImagePredictions { get; set; } = null!;
    public DbSet<LesionDetection> LesionDetections { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Patient>()
            .HasOne(p => p.AppUser)
            .WithOne(u => u.Patient)
            .HasForeignKey<Patient>(p => p.AppUserId);

        builder.Entity<Doctor>()
            .HasOne(d => d.AppUser)
            .WithOne(u => u.Doctor)
            .HasForeignKey<Doctor>(d => d.AppUserId);

        builder.Entity<Admin>()
            .HasOne(a => a.AppUser)
            .WithOne(u => u.Admin)
            .HasForeignKey<Admin>(a => a.AppUserId);
    }
}
