using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using TBPBackend.Api.Models;
using TBPBackend.Api.Service;

namespace TBPBackend.Tests;

public class TokenServiceTests
{
    private static TokenService CreateService() =>
        new(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                ["Jwt:Issuer"]    = "TestIssuer",
                ["Jwt:Audience"]  = "TestAudience",
            })
            .Build());

    private static AppUser MakeUser(string id = "user-1", string email = "test@example.com", string username = "testuser") =>
        new() { Id = id, Email = email, UserName = username };

    [Fact]
    public void CreateAccessToken_ReturnsNonEmptyString()
    {
        var token = CreateService().CreateAccessToken(MakeUser());
        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public void CreateAccessToken_ThrowsWhenEmailIsNull()
    {
        var user = MakeUser();
        user.Email = null;
        Assert.Throws<ArgumentException>(() => CreateService().CreateAccessToken(user));
    }

    [Fact]
    public void CreateAccessToken_ThrowsWhenUsernameIsNull()
    {
        var user = MakeUser();
        user.UserName = null;
        Assert.Throws<ArgumentException>(() => CreateService().CreateAccessToken(user));
    }

    [Fact]
    public void CreateAccessToken_ContainsSubClaim()
    {
        var token = CreateService().CreateAccessToken(MakeUser("user-42"));
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var sub = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(sub);
        Assert.Equal("user-42", sub.Value);
    }

    [Fact]
    public void CreateAccessToken_IncludesRoleClaims()
    {
        var token = CreateService().CreateAccessToken(MakeUser(), new List<string> { "Doctor", "Admin" });
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        // ReadJwtToken returns the JWT short-form claim name "role" (outbound mapping by handler)
        var roles = jwt.Claims.Where(c => c.Type == "role").Select(c => c.Value).ToList();
        Assert.Contains("Doctor", roles);
        Assert.Contains("Admin", roles);
    }

    [Fact]
    public void CreateAccessToken_WithNoRoles_HasNoRoleClaims()
    {
        var token = CreateService().CreateAccessToken(MakeUser());
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.DoesNotContain(jwt.Claims, c => c.Type == "role");
    }

    [Fact]
    public void CreateRefreshToken_ReturnsNonEmptyString()
    {
        Assert.False(string.IsNullOrWhiteSpace(CreateService().CreateRefreshToken()));
    }

    [Fact]
    public void CreateRefreshToken_DecodesTo10Bytes()
    {
        var token = CreateService().CreateRefreshToken();
        var bytes = Convert.FromBase64String(token);
        Assert.Equal(10, bytes.Length);
    }

    [Fact]
    public void HashRefreshToken_IsDeterministic()
    {
        var svc = CreateService();
        const string raw = "some-refresh-token";
        Assert.Equal(svc.HashRefreshToken(raw), svc.HashRefreshToken(raw));
    }

    [Fact]
    public void HashRefreshToken_DifferentInputsProduceDifferentHashes()
    {
        var svc = CreateService();
        Assert.NotEqual(svc.HashRefreshToken("token-a"), svc.HashRefreshToken("token-b"));
    }

    [Fact]
    public void HashRefreshToken_ReturnsBase64EncodedString()
    {
        var hash = CreateService().HashRefreshToken("any-token");
        var bytes = Convert.FromBase64String(hash); // must not throw
        Assert.Equal(32, bytes.Length); // SHA-256 = 32 bytes
    }

    [Fact]
    public void CreateRefreshToken_GeneratesUniqueTokensAcrossMultipleCalls()
    {
        var svc = CreateService();
        var tokens = Enumerable.Range(0, 20).Select(_ => svc.CreateRefreshToken()).ToList();
        Assert.Equal(20, tokens.Distinct().Count());
    }

    [Fact]
    public void CreateAccessToken_TwoDifferentUserIds_ProduceDifferentTokens()
    {
        var svc = CreateService();
        var t1 = svc.CreateAccessToken(MakeUser("u1"));
        var t2 = svc.CreateAccessToken(MakeUser("u2"));
        Assert.NotEqual(t1, t2);
    }
}
