using TBPBackend.Api.Models;
namespace TBPBackend.Api.Interfaces;

public interface ITokenService
{
    public string CreateAccessToken(AppUser user, IList<string>? roles = null);

    public string CreateRefreshToken();

    public static abstract string HashRefreshToken(string refreshToken);
}