using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TBPBackend.Api.Models.Tables;

public class ImagePrediction
{
    [Key]
    public long Id { get; set; }

    public long UserImageId { get; set; }
    [ForeignKey("UserImageId")]
    public UserImage UserImage { get; set; } = null!;

    [Required]
    public int NumLesions { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public virtual ICollection<LesionDetection> LesionDetections { get; set; } = new List<LesionDetection>();
}
