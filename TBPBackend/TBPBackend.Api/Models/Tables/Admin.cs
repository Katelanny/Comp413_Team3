using System.ComponentModel.DataAnnotations;

namespace TBPBackend.Api.Models.Tables;

public class Admin
{
    [Key]
    public long Id { get; set; }

    [Required]
    public string FirstName { get; set; } = null!;

    [Required]
    public string LastName { get; set; } = null!;

    [Required]
    public string Email { get; set; } = null!;

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime LastLoginAtUtc { get; set; } = DateTime.UtcNow;
    
}