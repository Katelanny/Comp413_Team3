using System.ComponentModel.DataAnnotations;

namespace TBPBackend.Api.Models.Tables;

public class Patient
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
    public string Phone { get; set; } = null!;
    
    [Required]
    public string Gender { get; set; } = null!;

    [Required]
    public string DateOfBirth { get; set; } = null!;

    [Required]
    public bool HasAccessToDiagnosis { get; set; } = false;

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime LastLoginAtUtc { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Visits> Visits { get; set; } = new List<Visits>();
}