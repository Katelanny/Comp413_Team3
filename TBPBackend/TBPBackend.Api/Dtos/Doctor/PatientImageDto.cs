namespace TBPBackend.Api.Dtos.Doctor;

public class PatientImageDto
{
    public long ImageId { get; set; }
    public string Url { get; set; } = null!;
    public string? CameraAngle { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
