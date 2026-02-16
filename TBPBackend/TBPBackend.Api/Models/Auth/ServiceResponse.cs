namespace TBPBackend.Api.Models.Auth;

public class ServiceResponse
{
    public bool Success { get; private set; }
    public string? RefreshToken { get; private set; }
    public string? Message { get; private set; }
    public CookieOptions? CookieOptions { get; private set; }
    
    public string AccessToken { get; private set; }
    
    private ServiceResponse() { }
    
    public static ServiceResponse Ok(string refreshToken, CookieOptions options, string accessToken)
    {
        return new ServiceResponse
        {
            Success = true,
            RefreshToken = refreshToken,
            CookieOptions = options,
            Message = null,
            AccessToken = accessToken
        };
    }
    
    public static ServiceResponse Fail(string message)
    {
        return new ServiceResponse
        {
            Success = false,
            Message = message,
            RefreshToken = null,
            CookieOptions = null
        };
    }
}