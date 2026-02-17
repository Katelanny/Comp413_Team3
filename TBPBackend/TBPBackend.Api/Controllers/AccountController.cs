using Microsoft.AspNetCore.Mvc;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;

    public AccountController(
        ITokenService tokenService,
        IAuthService authService
        )
    { ;
        _tokenService = tokenService;
        _authService = authService;
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto model)
    {
        // Valdiating the incoming data
        if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
            return BadRequest("Username and password are required.");
        var user = await _authService.Login(model);
        if (!user.Success) return Problem(user.Message);
        if (user.RefreshToken == null || user.CookieOptions == null)
        {
            return Problem("Something went wrong and we couldnt get your refresh or access");
        }
        Response.Cookies.Append("refresh_token", user.RefreshToken, user.CookieOptions);
        return Ok(new AuthResponseDto
        {
            Token = user.AccessToken
        });
    }


    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        // First want to validate and make sure they are good
        if (string.IsNullOrWhiteSpace(model.Username) ||
            string.IsNullOrWhiteSpace(model.Email) ||
            string.IsNullOrWhiteSpace(model.Password))
            return BadRequest("Username, email, and password are required.");
        // Creating the user
        var user = await _authService.Register(model);
        // We need to check if it was successful
        if (!user.Success) return Problem("Something went brutally wrong. Failed on registration.");
        // Now we need to update the cookies 
        if (user.RefreshToken == null || user.CookieOptions == null)
        {
            return Problem("Something went wrong and we couldnt get your refresh or access");
        }
        Response.Cookies.Append("refresh_token", user.RefreshToken, user.CookieOptions);
        return Ok( new AuthResponseDto
        {
            Token = user.AccessToken,
        });

    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh()
    {
        // Checking to see if refresh even exists
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized("Missing refresh token.");
        // here we are going to start checking the token
        var service = await _authService.CheckRefreshToken(refreshToken);
        if (!service.Success) return Problem(service.Message);
        // At this point, we have refresh, cookies, and access. All wee ned
        // is to give the user the new access
        return Ok(new AuthResponseDto
        {
            Token = service.AccessToken,
        });
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        // We are going to extract the refresh token. If none present, they are logged out
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
            return Ok();
        var refreshHash = _tokenService.HashRefreshToken(refreshToken);
        // Now we are hashing to see if it matches our records 
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