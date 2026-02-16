using System.Buffers.Text;
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
    
    public string CreateAccessToken(AppUser user, IList<string>? roles = null)
    {
        if (user is { Email: null } or { UserName: null })
        {
            throw new ArgumentException("UserName or Email can't be null.");
        }
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.GivenName, user.UserName)
        };
        
        // Adding the roles that are passed in
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
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

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(10);
        return Convert.ToBase64String(bytes);
    }

    public static string HashRefreshToken(string refreshToken)
    {
        var bytes = Encoding.UTF8.GetBytes(refreshToken);
        // generating the hash
        var hash = SHA3_256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}