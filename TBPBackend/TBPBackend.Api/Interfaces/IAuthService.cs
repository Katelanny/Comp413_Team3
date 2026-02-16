using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Models.Auth;

namespace TBPBackend.Api.Interfaces;

public interface IAuthService
{
    public Task<ServiceResponse> Login(LoginDto dto);
    
    public Task<ServiceResponse> Register(RegisterDto dto);

    public Task<bool> Logout();
}