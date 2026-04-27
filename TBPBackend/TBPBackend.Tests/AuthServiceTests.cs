using Microsoft.AspNetCore.Identity;
using Moq;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;
using TBPBackend.Api.Service;

namespace TBPBackend.Tests;

public class AuthServiceTests
{
    private static Mock<UserManager<AppUser>> CreateUserManagerMock()
    {
        var store = new Mock<IUserStore<AppUser>>();
        return new Mock<UserManager<AppUser>>(
            store.Object, null, null, null, null, null, null, null, null);
    }

    private static AppUser MakeUser(string id = "u1") =>
        new() { Id = id, Email = "test@example.com", UserName = "testuser" };

    private static (Mock<IAccountRepo> repo, Mock<ITokenService> token, Mock<UserManager<AppUser>> um) CreateMocks()
    {
        var repo  = new Mock<IAccountRepo>();
        var token = new Mock<ITokenService>();
        var um    = CreateUserManagerMock();

        token.Setup(t => t.CreateRefreshToken()).Returns("raw-token");
        token.Setup(t => t.HashRefreshToken(It.IsAny<string>())).Returns("hashed-token");
        token.Setup(t => t.CreateAccessToken(It.IsAny<AppUser>(), It.IsAny<IList<string>>()))
             .Returns("access-token");
        um.Setup(u => u.GetRolesAsync(It.IsAny<AppUser>()))
          .ReturnsAsync(new List<string> { "Patient" });

        return (repo, token, um);
    }

    // ── Login ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ReturnsFail_WhenRepoFails()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.Login(It.IsAny<LoginDto>(), It.IsAny<string>()))
            .ReturnsAsync(new DbLoginResponse { Success = false, Message = "Bad credentials" });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.Login(new LoginDto { Username = "u", Password = "p" });

        Assert.False(result.Success);
        Assert.Equal("Bad credentials", result.Message);
    }

    [Fact]
    public async Task Login_ReturnsOk_WhenRepoSucceeds()
    {
        var user = MakeUser();
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.Login(It.IsAny<LoginDto>(), It.IsAny<string>()))
            .ReturnsAsync(new DbLoginResponse { Success = true, User = user });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.Login(new LoginDto { Username = "u", Password = "p" });

        Assert.True(result.Success);
        Assert.Equal("raw-token", result.RefreshToken);
        Assert.Equal("access-token", result.AccessToken);
        Assert.NotNull(result.CookieOptions);
    }

    [Fact]
    public async Task Login_ReturnsFail_WhenUserIsNull()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.Login(It.IsAny<LoginDto>(), It.IsAny<string>()))
            .ReturnsAsync(new DbLoginResponse { Success = false, User = null });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.Login(new LoginDto { Username = "u", Password = "p" });

        Assert.False(result.Success);
    }

    // ── Register ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ReturnsFail_WhenRepoFails()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.CreateUser(It.IsAny<RegisterDto>(), It.IsAny<string>(), It.IsAny<AppUser>()))
            .ReturnsAsync(new DbResponse { Success = false, Message = "Username taken" });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.Register(new RegisterDto { Username = "u", Email = "e@e.com", Password = "pass" });

        Assert.False(result.Success);
        Assert.Equal("Username taken", result.Message);
    }

    [Fact]
    public async Task Register_ReturnsOk_WhenRepoSucceeds()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.CreateUser(It.IsAny<RegisterDto>(), It.IsAny<string>(), It.IsAny<AppUser>()))
            .ReturnsAsync(new DbResponse { Success = true });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.Register(new RegisterDto { Username = "u", Email = "e@e.com", Password = "pass" });

        Assert.True(result.Success);
        Assert.Equal("raw-token", result.RefreshToken);
        Assert.Equal("access-token", result.AccessToken);
        Assert.NotNull(result.CookieOptions);
    }

    // ── CheckRefreshToken ─────────────────────────────────────────────────────

    [Fact]
    public async Task CheckRefreshToken_ReturnsFail_WhenTokenNotFound()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.CheckTokenHash(It.IsAny<string>()))
            .ReturnsAsync(new IsRefreshMatch { IsMatch = false, Message = "Invalid token." });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.CheckRefreshToken("bad-token");

        Assert.False(result.Success);
    }

    [Fact]
    public async Task CheckRefreshToken_ReturnsOk_WhenTokenMatches()
    {
        var user = MakeUser();
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.CheckTokenHash(It.IsAny<string>()))
            .ReturnsAsync(new IsRefreshMatch { IsMatch = true, User = user });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        var result = await svc.CheckRefreshToken("valid-token");

        Assert.True(result.Success);
        Assert.Equal("access-token", result.AccessToken);
        // On refresh the original token is passed back unchanged
        Assert.Equal("valid-token", result.RefreshToken);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Logout_ReturnsTrue_WhenRepoSucceeds()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.Logout(It.IsAny<string>()))
            .ReturnsAsync(new DbResponse { Success = true });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        Assert.True(await svc.Logout("some-hash"));
    }

    [Fact]
    public async Task Logout_ReturnsFalse_WhenRepoFails()
    {
        var (repo, token, um) = CreateMocks();
        repo.Setup(r => r.Logout(It.IsAny<string>()))
            .ReturnsAsync(new DbResponse { Success = false });

        var svc = new AuthService(repo.Object, token.Object, um.Object);
        Assert.False(await svc.Logout("bad-hash"));
    }

    // ── PartialCookieOptions ──────────────────────────────────────────────────

    [Fact]
    public void PartialCookieOptions_IsHttpOnly()
    {
        var opts = AuthService.PartialCookieOptions(DateTimeOffset.UtcNow.AddDays(7));
        Assert.True(opts.HttpOnly);
    }

    [Fact]
    public void PartialCookieOptions_PathIsAccountEndpoint()
    {
        var opts = AuthService.PartialCookieOptions(DateTimeOffset.UtcNow.AddDays(7));
        Assert.Equal("/api/account", opts.Path);
    }
}
