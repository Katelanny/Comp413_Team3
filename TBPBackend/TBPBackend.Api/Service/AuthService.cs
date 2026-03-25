using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;

namespace TBPBackend.Api.Service;

public class AuthService : IAuthService
{
    private readonly IAccountRepo _accountRepo;
    private readonly ITokenService _tokenService;
    
    public AuthService(IAccountRepo accountRepo, ITokenService tokenService)
    {
        _accountRepo = accountRepo;
        _tokenService = tokenService;
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
        // Creating the user and passing it in
        var user = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Username
        };
        // Creating the token/token hash
        var token = _tokenService.CreateRefreshToken();
        var tokenHash = _tokenService.HashRefreshToken(token);
        // Passing to our repo to actually store in the db
        var res = await _accountRepo.CreateUser(dto, tokenHash, user);
        // If it failed, we want to drill that up
        if (!res.Success)
        {
            return ServiceResponse.Fail(res.Message ?? "Failed on creation.");
        }
        // TODO: Make sure to insert roles. Right now they are all users so its fine
        var accessToken = _tokenService.CreateAccessToken(user);
        // Now we know it is already stored, and we need to 
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
        
        var accessToken = _tokenService.CreateAccessToken(loginRes.User);
        return ServiceResponse.Ok
        (
            token, PartialCookieOptions(DateTimeOffset.UtcNow.AddDays(7)), accessToken
        );
    }

    public async Task<ServiceResponse> CheckRefreshToken(string refreshToken)
    {
        
        var refreshHash = _tokenService.HashRefreshToken(refreshToken);
        var isTokenHash = await _accountRepo.CheckTokenHash(refreshHash);
        // We want to only proceed if we found a match and have the user in hand
        if (!isTokenHash.IsMatch || isTokenHash.User == null)
        {
            return ServiceResponse.Fail("Token must have expired or we couldn't load your profile.");
        }
        // Now we want to create a new access and give it to them
        var accessToken = _tokenService.CreateAccessToken(isTokenHash.User);
        return ServiceResponse.Ok(
                refreshToken, PartialCookieOptions(DateTimeOffset.UtcNow), accessToken);
    }
    
    public async Task<bool> Logout(string refreshHash)
    {
        // Here we are going to do modifications into the db on the repo
        var status = await _accountRepo.Logout(refreshHash);
        return status.Success;
    }
    
}