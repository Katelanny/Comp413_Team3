namespace TBPBackend.Api.Dtos.Account;

public class AuthCookieDto
{
    public string Name { get; set; }
    public string Value { get; set; }
    public CookieOptions CookieOptions { get; set; }
}