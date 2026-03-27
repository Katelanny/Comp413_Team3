namespace TBPBackend.Api.Dtos.Dashboard;

public class PatientDashboardDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool HasAccessToDiagnosis { get; set; }
    public List<ImageInfoDto> Images { get; set; } = new();
    public List<LesionInfoDto> Lesions { get; set; } = new();
}

public class ImageInfoDto
{
    public string FileName { get; set; } = null!;
    public string Url { get; set; } = null!;
    public DateTime DateTaken { get; set; }
}

public class LesionInfoDto
{
    public long Id { get; set; }
    public string AnatomicalSite { get; set; } = null!;
    public string? Diagnosis { get; set; }
    public int NumberOfLesions { get; set; }
    public DateTime DateRecorded { get; set; }
}
