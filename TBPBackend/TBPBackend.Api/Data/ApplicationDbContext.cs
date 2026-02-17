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

    
}