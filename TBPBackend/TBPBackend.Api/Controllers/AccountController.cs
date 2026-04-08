using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;
    private readonly UserManager<AppUser> _userManager;

    public AccountController(
        ITokenService tokenService,
        IAuthService authService,
        UserManager<AppUser> userManager)
    {
        _tokenService = tokenService;
        _authService = authService;
        _userManager = userManager;
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto model)
    {
        if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
            return BadRequest("Username and password are required.");

        var user = await _authService.Login(model);
        if (!user.Success) return Problem(user.Message);
        if (user.RefreshToken == null || user.CookieOptions == null)
            return Problem("Something went wrong and we couldnt get your refresh or access");

        Response.Cookies.Append("refresh_token", user.RefreshToken, user.CookieOptions);

        var appUser = await _userManager.FindByNameAsync(model.Username);
        var roles = appUser != null ? await _userManager.GetRolesAsync(appUser) : [];

        return Ok(new AuthResponseDto
        {
            Token = user.AccessToken,
            Role = roles.FirstOrDefault(),
            Username = model.Username
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (string.IsNullOrWhiteSpace(model.Username) ||
            string.IsNullOrWhiteSpace(model.Email) ||
            string.IsNullOrWhiteSpace(model.Password))
            return BadRequest("Username, email, and password are required.");

        var user = await _authService.Register(model);
        if (!user.Success) return Problem(user.Message ?? "Failed on registration.");
        if (user.RefreshToken == null || user.CookieOptions == null)
            return Problem("Something went wrong and we couldnt get your refresh or access");

        Response.Cookies.Append("refresh_token", user.RefreshToken, user.CookieOptions);

        return Ok(new AuthResponseDto
        {
            Token = user.AccessToken,
            Role = model.Role,
            Username = model.Username
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh()
    {
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized("Missing refresh token.");

        var service = await _authService.CheckRefreshToken(refreshToken);
        if (!service.Success) return Problem(service.Message);

        return Ok(new AuthResponseDto
        {
            Token = service.AccessToken,
        });
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
            return Ok();

        var refreshHash = _tokenService.HashRefreshToken(refreshToken);
        var deleteStatus = await _authService.Logout(refreshHash);
        Response.Cookies.Delete("refresh_token", new CookieOptions
        {
            Path = "/api/account",
            Secure = false,
            SameSite = SameSiteMode.Lax
        });
        return Ok($"Deletion status: {deleteStatus}");
    }
}
