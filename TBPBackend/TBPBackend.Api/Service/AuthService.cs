using Microsoft.AspNetCore.Identity;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;

namespace TBPBackend.Api.Service;

public class AuthService : IAuthService
{
    private readonly IAccountRepo _accountRepo;
    private readonly ITokenService _tokenService;
    private readonly UserManager<AppUser> _userManager;
    
    public AuthService(IAccountRepo accountRepo, ITokenService tokenService, UserManager<AppUser> userManager)
    {
        _accountRepo = accountRepo;
        _tokenService = tokenService;
        _userManager = userManager;
    }

    public static CookieOptions PartialCookieOptions(DateTimeOffset expires) => new CookieOptions
    {
        HttpOnly = true,
        Secure = false,
        SameSite = SameSiteMode.Lax,
        Expires = expires,
        Path = "/api/account"
    };
    
    public async Task<ServiceResponse> Register(RegisterDto dto)
    {
        var user = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Username
        };
        var token = _tokenService.CreateRefreshToken();
        var tokenHash = _tokenService.HashRefreshToken(token);
        var res = await _accountRepo.CreateUser(dto, tokenHash, user);
        if (!res.Success)
        {
            return ServiceResponse.Fail(res.Message ?? "Failed on creation.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.CreateAccessToken(user, roles);
        return ServiceResponse.Ok
        (
            token, PartialCookieOptions(DateTimeOffset.UtcNow.AddDays(7)), accessToken
        );
    }
    
    public async Task<ServiceResponse> Login(LoginDto dto)
    {
        var token = _tokenService.CreateRefreshToken();
        var tokenHash = _tokenService.HashRefreshToken(token);
        var loginRes = await _accountRepo.Login(dto, tokenHash);
        if (!loginRes.Success || loginRes.User == null)
        {
            return ServiceResponse.Fail(loginRes.Message ?? "Something went wrong logging in");
        }
        
        var roles = await _userManager.GetRolesAsync(loginRes.User);
        var accessToken = _tokenService.CreateAccessToken(loginRes.User, roles);
        return ServiceResponse.Ok
        (
            token, PartialCookieOptions(DateTimeOffset.UtcNow.AddDays(7)), accessToken
        );
    }

    public async Task<ServiceResponse> CheckRefreshToken(string refreshToken)
    {
        var refreshHash = _tokenService.HashRefreshToken(refreshToken);
        var isTokenHash = await _accountRepo.CheckTokenHash(refreshHash);
        if (!isTokenHash.IsMatch || isTokenHash.User == null)
        {
            return ServiceResponse.Fail("Token must have expired or we couldn't load your profile.");
        }

        var roles = await _userManager.GetRolesAsync(isTokenHash.User);
        var accessToken = _tokenService.CreateAccessToken(isTokenHash.User, roles);
        return ServiceResponse.Ok(
                refreshToken, PartialCookieOptions(DateTimeOffset.UtcNow), accessToken);
    }
    
    public async Task<bool> Logout(string refreshHash)
    {
        var status = await _accountRepo.Logout(refreshHash);
        return status.Success;
    }
}
