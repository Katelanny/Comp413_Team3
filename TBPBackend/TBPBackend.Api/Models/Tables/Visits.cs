using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TBPBackend.Api.Models.Tables;

public class Visits
{
    [Key]
    public long Id { get; set; }

    public long PatientId { get; set; }
    [ForeignKey("PatientId")]
    public Patient Patient { get; set; } = null!;

    public long DoctorId { get; set; }
    [ForeignKey("DoctorId")]
    public Doctor Doctor { get; set; } = null!;

    [Required]
    public DateTime VisitDate { get; set; } = DateTime.UtcNow;
    
    public string VisitNotes { get; set; } = null!;
    
}