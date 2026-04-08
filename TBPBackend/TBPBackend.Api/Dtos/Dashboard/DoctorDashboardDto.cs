namespace TBPBackend.Api.Dtos.Dashboard;

public class DoctorDashboardDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public List<DoctorPatientSummaryDto> Patients { get; set; } = new();
}

public class DoctorPatientSummaryDto
{
    public long PatientId { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public DateTime? LastVisitDate { get; set; }
}

public class DoctorPatientDetailDto
{
    public long PatientId { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public List<ImageInfoDto> Images { get; set; } = new();
    public List<LesionInfoDto> Lesions { get; set; } = new();
}
