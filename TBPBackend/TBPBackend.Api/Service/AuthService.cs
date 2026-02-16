using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;

namespace TBPBackend.Api.Service;

public class AuthService : IAuthService
{
    private IAccountRepo _accountRepo;
    private ITokenService _tokenService;
    
    public AuthService(IAccountRepo accountRepo, ITokenService tokenService)
    {
        _accountRepo = accountRepo;
        _tokenService = tokenService;
    }

    public static CookieOptions PartialCookieOptions(DateTimeOffset expires) => new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Lax,
        Expires = expires,
        Path = "/api/account/refresh"
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
        var tokenHash = TokenService.HashRefreshToken(token);
        // Passing to our repo to actually store in the db
        var res = await _accountRepo.CreateUser(dto, tokenHash, user);
        // If it failed, we want to drill that up
        if (!res.Success)
        {
            return ServiceResponse.Fail("Something went brutally wrong. Failed on creation.");
        }
        // TODO: Make sure to insert roles. Right now they are all users so its fine
        var accessToken = _tokenService.CreateAccessToken(user);
        // Now we know it is already stored, and we need to 
        return ServiceResponse.Ok
        (
            token, PartialCookieOptions(DateTimeOffset.UtcNow), accessToken
        );
    }
    
    public async Task<ServiceResponse> Login(LoginDto dto)
    {
        var token = _tokenService.CreateRefreshToken();
        var tokenHash = TokenService.HashRefreshToken(token);
        var loginRes = await _accountRepo.Login(dto, tokenHash);
        if (!loginRes.Success || loginRes.User == null)
        {
            return ServiceResponse.Fail(loginRes.Message ?? "Something went wrong logging in");
        }
        
        var accessToken = _tokenService.CreateAccessToken(loginRes.User);
        return ServiceResponse.Ok
        (
            token, PartialCookieOptions(DateTimeOffset.UtcNow), accessToken
        );
    }

    public Task<bool> Logout()
    {
        throw new NotImplementedException();
    }
}