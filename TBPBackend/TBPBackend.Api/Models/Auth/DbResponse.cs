namespace TBPBackend.Api.Models.Auth;

public class DbResponse
{
    public required bool Success { get; set; }
    public string? Message { get; set; }
}