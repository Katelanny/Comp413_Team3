namespace TBPBackend.Api.Models.Auth;

public class DbLoginResponse
{
    public required bool Success { get; set; }
    
    public string? Message { get; set; }
    
    public AppUser? User { get; set; }
}