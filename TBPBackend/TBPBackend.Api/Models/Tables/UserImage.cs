using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TBPBackend.Api.Models.Tables;

public class UserImage
{
    [Key]
    public long Id { get; set; }

    [Required]
    public string AppUserId { get; set; } = null!;

    [ForeignKey("AppUserId")]
    public AppUser AppUser { get; set; } = null!;

    [Required]
    [MaxLength(512)]
    public string FileName { get; set; } = null!;

    [MaxLength(128)]
    public string? ModelName { get; set; }

    public int? ImageIndex { get; set; }

    public int? Count { get; set; }

    [MaxLength(64)]
    public string? CameraAngle { get; set; }

    public int? Height { get; set; }

    public int? Width { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
