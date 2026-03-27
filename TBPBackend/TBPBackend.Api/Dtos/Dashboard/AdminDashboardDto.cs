namespace TBPBackend.Api.Dtos.Dashboard;

public class AdminDashboardDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public AdminUsersDto Users { get; set; } = new();
    public List<ActivityDto> RecentActivity { get; set; } = new();
}

public class AdminUsersDto
{
    public int TotalUsers { get; set; }
    public List<AdminUserInfoDto> Patients { get; set; } = new();
    public List<AdminUserInfoDto> Doctors { get; set; } = new();
    public List<AdminUserInfoDto> Admins { get; set; } = new();
}

public class AdminUserInfoDto
{
    public long Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime LastLoginAtUtc { get; set; }
}

public class ActivityDto
{
    public string Type { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public DateTime Timestamp { get; set; }
}
