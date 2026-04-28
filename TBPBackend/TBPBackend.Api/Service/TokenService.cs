using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;

namespace TBPBackend.Api.Service;

public class TokenService : ITokenService
{
    private readonly SymmetricSecurityKey _secretKey;
    private readonly IConfiguration _config;

    public TokenService(IConfiguration configuration)
    {
        _config = configuration;
        _secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:SecretKey"] ?? throw new InvalidOperationException()));
    }

    /// Creates a signed JWT access token with the user's identity and role claims. Token expires in 7 days.
    public string CreateAccessToken(AppUser user, IList<string>? roles = null)
    {
        if (user is { Email: null } or { UserName: null })
        {
            throw new ArgumentException("UserName or Email can't be null.");
        }
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.GivenName, user.UserName)
        };

        if (roles != null)
        {
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }
        var creds = new SigningCredentials(_secretKey, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(7),
            SigningCredentials = creds,
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    /// Generates a cryptographically random refresh token encoded as a base64 string.
    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(10);
        return Convert.ToBase64String(bytes);
    }

    /// Returns the SHA-256 hash of a refresh token for safe storage in the database.
    public string HashRefreshToken(string refreshToken)
    {
        var bytes = Encoding.UTF8.GetBytes(refreshToken);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}
