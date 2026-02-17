using System.ComponentModel.DataAnnotations;

namespace TBPBackend.Api.Models.Tables;

public class RefreshToken
{
    [Key]
    public long Id { get; set; }

    [Required]
    public string TokenHash { get; set; } = null!;

    [Required]
    public string AppUserId { get; set; } = null!;
    public AppUser AppUser { get; set; } = null!;

    [Required]
    public DateTime CreatedAtUtc { get; set; }

    [Required]
    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? RevokedAtUtc { get; set; }
}