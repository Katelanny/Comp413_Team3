using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TBPBackend.Api.Models.Tables;

public class LesionDetection
{
    [Key]
    public long Id { get; set; }

    public long ImagePredictionId { get; set; }
    [ForeignKey("ImagePredictionId")]
    public ImagePrediction ImagePrediction { get; set; } = null!;

    // "{img_id}_{index}" from the ML service (e.g. "178_0")
    [Required]
    [MaxLength(128)]
    public string LesionId { get; set; } = null!;

    [Required]
    public float BoxX1 { get; set; }
    [Required]
    public float BoxY1 { get; set; }
    [Required]
    public float BoxX2 { get; set; }
    [Required]
    public float BoxY2 { get; set; }

    [Required]
    public float Score { get; set; }

    // JSON-serialized list of polygon contours: float[][]
    [Required]
    public string PolygonMask { get; set; } = null!;

    [MaxLength(256)]
    public string? AnatomicalSite { get; set; }

    // LesionId of the matched lesion from the previous timepoint
    [MaxLength(128)]
    public string? PrevLesionId { get; set; }

    public float? RelativeSizeChange { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
