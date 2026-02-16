using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Tables;
using TBPBackend.Api.Service;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
    public async Task<IActionResult> Login()
    {
        return Ok();
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok();
    }
}