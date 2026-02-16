using System.Data.Entity.Infrastructure;
using Microsoft.AspNetCore.Identity;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Repository;

public class AccountRepo : IAccountRepo
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    
    public AccountRepo(ApplicationDbContext context, UserManager<AppUser> userManager)
    {
        _db = context;
        _userManager = userManager;
    }

    private async Task<bool> StoreRefreshToken(string uid, string refreshTokenHash)
    {
        try
        {
            _db.RefreshTokens.Add(new RefreshToken
            {
                AppUserId = uid,
                TokenHash = refreshTokenHash,
                CreatedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(30),
            });
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return false;
        }

        return true;
    }

    public async Task<DbResponse> CreateUser(RegisterDto model, string refreshTokenHash, AppUser user)
    {
        if (model.Password == null) return new DbResponse { Success = false, Message = "Password is required" }; 
        // Now we want to save the token to the db
        var createRes = await _userManager.CreateAsync(user, model.Password);
        if (!createRes.Succeeded)
        {
            return new DbResponse { Success = false, Message = "Something went wrong and we couldnt store user" };
        }
        // Going to save the refresh token
        var refreshStorageStatus = await StoreRefreshToken(user.Id, refreshTokenHash);
        if (!refreshStorageStatus) return new DbResponse { Success = false, Message = "Refresh storage did not store" };
        return new DbResponse { Success = true };
    }

    public async Task<DbLoginResponse> Login(LoginDto model, string tokenHash)
    {
        // trying to find the user. If anyone sees this is 2:35 AM
        var user = await _userManager.FindByNameAsync(model.Username);
        if (user == null) return new  DbLoginResponse() { Success = false, Message = "Username or password is incorrect" };
        // trying to find the password
        var pwRes = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!pwRes) return new DbLoginResponse() { Success = false, Message = "Password is incorrect" };
        // storing the refresh token
        var refreshStorageStatus = await StoreRefreshToken(user.Id, tokenHash);
        // if something went wrong we alert the user 
        if (!refreshStorageStatus) return new DbLoginResponse() { Success = false, Message = "Refresh storage did not store" };
        return new DbLoginResponse() { Success = true, User = user };
    }
}