using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TBPBackend.Api.Controllers;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;

namespace TBPBackend.Tests;

public class AccountControllerTests
{
    private static Mock<UserManager<AppUser>> CreateUserManagerMock()
    {
        var store = new Mock<IUserStore<AppUser>>();
        return new Mock<UserManager<AppUser>>(
            store.Object, null, null, null, null, null, null, null, null);
    }

    private static AccountController CreateController(
        Mock<IAuthService>? auth = null,
        Mock<ITokenService>? token = null,
        Mock<UserManager<AppUser>>? um = null)
    {
        var controller = new AccountController(
            (token ?? new Mock<ITokenService>()).Object,
            (auth  ?? new Mock<IAuthService>()).Object,
            (um    ?? CreateUserManagerMock()).Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    // ── Login ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ReturnsBadRequest_WhenUsernameIsEmpty()
    {
        var controller = CreateController();
        var result = await controller.Login(new LoginDto { Username = "", Password = "pass" });
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ReturnsBadRequest_WhenPasswordIsEmpty()
    {
        var controller = CreateController();
        var result = await controller.Login(new LoginDto { Username = "user", Password = "" });
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ReturnsBadRequest_WhenBothEmpty()
    {
        var controller = CreateController();
        var result = await controller.Login(new LoginDto { Username = " ", Password = " " });
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_ReturnsProblem_WhenServiceFails()
    {
        var auth = new Mock<IAuthService>();
        auth.Setup(s => s.Login(It.IsAny<LoginDto>()))
            .ReturnsAsync(ServiceResponse.Fail("Invalid credentials"));

        var controller = CreateController(auth: auth);
        var result = await controller.Login(new LoginDto { Username = "user", Password = "wrong" });

        Assert.IsType<ObjectResult>(result.Result);
        var obj = (ObjectResult)result.Result!;
        Assert.Equal(500, obj.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnsOk_WhenSuccessful()
    {
        var auth  = new Mock<IAuthService>();
        var um    = CreateUserManagerMock();
        var user  = new AppUser { Id = "u1", Email = "e@e.com", UserName = "testuser" };

        auth.Setup(s => s.Login(It.IsAny<LoginDto>()))
            .ReturnsAsync(ServiceResponse.Ok("refresh", new CookieOptions { Path = "/api/account" }, "access-token"));
        um.Setup(u => u.FindByNameAsync("testuser")).ReturnsAsync(user);
        um.Setup(u => u.GetRolesAsync(It.IsAny<AppUser>()))
          .ReturnsAsync(new List<string> { "Patient" });

        var controller = CreateController(auth: auth, um: um);
        var result = await controller.Login(new LoginDto { Username = "testuser", Password = "pass" });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.Equal("access-token", dto.Token);
        Assert.Equal("testuser", dto.Username);
        Assert.Equal("Patient", dto.Role);
    }

    // ── Register ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenUsernameEmpty()
    {
        var controller = CreateController();
        var result = await controller.Register(new RegisterDto { Username = "", Email = "e@e.com", Password = "pass" });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenEmailEmpty()
    {
        var controller = CreateController();
        var result = await controller.Register(new RegisterDto { Username = "u", Email = "", Password = "pass" });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenPasswordEmpty()
    {
        var controller = CreateController();
        var result = await controller.Register(new RegisterDto { Username = "u", Email = "e@e.com", Password = "" });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Register_ReturnsOk_WhenSuccessful()
    {
        var auth = new Mock<IAuthService>();
        auth.Setup(s => s.Register(It.IsAny<RegisterDto>()))
            .ReturnsAsync(ServiceResponse.Ok("refresh", new CookieOptions { Path = "/api/account" }, "access-token"));

        var controller = CreateController(auth: auth);
        var result = await controller.Register(new RegisterDto { Username = "newuser", Email = "new@e.com", Password = "password123", Role = "Patient" });

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.Equal("access-token", dto.Token);
        Assert.Equal("Patient", dto.Role);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Refresh_ReturnsUnauthorized_WhenNoCookie()
    {
        var controller = CreateController();
        var result = await controller.Refresh();
        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task Refresh_ReturnsOk_WhenValidToken()
    {
        var auth = new Mock<IAuthService>();
        auth.Setup(s => s.CheckRefreshToken("valid-token"))
            .ReturnsAsync(ServiceResponse.Ok("valid-token", new CookieOptions(), "new-access"));

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["Cookie"] = "refresh_token=valid-token";

        var controller = new AccountController(
            new Mock<ITokenService>().Object,
            auth.Object,
            CreateUserManagerMock().Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };

        var result = await controller.Refresh();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.Equal("new-access", dto.Token);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Logout_ReturnsOk_WhenNoCookie()
    {
        var controller = CreateController();
        var result = await controller.Logout();
        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task Logout_ReturnsOk_WhenCookiePresentAndDeleted()
    {
        var auth  = new Mock<IAuthService>();
        var token = new Mock<ITokenService>();
        auth.Setup(s => s.Logout(It.IsAny<string>())).ReturnsAsync(true);
        token.Setup(t => t.HashRefreshToken(It.IsAny<string>())).Returns("hashed");

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["Cookie"] = "refresh_token=some-token";

        var controller = new AccountController(token.Object, auth.Object, CreateUserManagerMock().Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };

        var result = await controller.Logout();
        Assert.IsType<OkObjectResult>(result);
    }
}
