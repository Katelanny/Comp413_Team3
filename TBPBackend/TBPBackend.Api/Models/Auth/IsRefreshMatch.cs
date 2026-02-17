namespace TBPBackend.Api.Models.Auth;

public class IsRefreshMatch
{
    public string? Message;
    
    public bool IsMatch;

    public AppUser? User;
}