using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Interfaces;

public interface IAccountRepo
{
    
    public Task<DbResponse> CreateUser(RegisterDto model, string tokenHash, AppUser user);

    public Task<DbLoginResponse> Login(LoginDto model, string tokenHash);
    
    public Task<DbResponse> Logout(string refreshHash);

    public Task<IsRefreshMatch> CheckTokenHash(string tokenHash);
    
}