using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TBPBackend.Api.Models.Tables;

public class Lesion
{
    [Key]
    public long Id { get; set; }

    public long PatientId { get; set; }
    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;

    [Required]
    [MaxLength(256)]
    public string AnatomicalSite { get; set; } = null!;

    [MaxLength(512)]
    public string? Diagnosis { get; set; }

    [Required]
    public int NumberOfLesions { get; set; }

    [Required]
    public DateTime DateRecorded { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
