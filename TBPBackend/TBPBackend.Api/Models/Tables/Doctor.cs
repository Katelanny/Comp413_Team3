using System.ComponentModel.DataAnnotations;

namespace TBPBackend.Api.Models.Tables;

public class Doctor
{
    [Key]
    public long Id { get; set; }

    [Required]
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime LastLoginAtUtc { get; set; } = DateTime.UtcNow;
    
    public virtual ICollection<Visits> Visits { get; set; } = new List<Visits>();
}