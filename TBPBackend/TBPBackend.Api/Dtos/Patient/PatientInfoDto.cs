namespace TBPBackend.Api.Dtos.Patient;

public class PatientInfoDto
{
    public long Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Gender { get; set; } = null!;
    public string DateOfBirth { get; set; } = null!;
    public bool HasAccessToDiagnosis { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime LastLoginAtUtc { get; set; }
}

