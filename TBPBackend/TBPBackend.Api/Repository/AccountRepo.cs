using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Dtos.Account;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;
using TBPBackend.Api.Models.Tables;
using DbUpdateException = System.Data.Entity.Infrastructure.DbUpdateException;

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

    /// Persists a hashed refresh token for the given user with a 30-day expiry.
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

    /// Creates a new Identity user, assigns the specified role, and stores the initial refresh token.
    public async Task<DbResponse> CreateUser(RegisterDto model, string refreshTokenHash, AppUser user)
    {
        if (model.Password == null) return new DbResponse { Success = false, Message = "Password is required" };
        var createRes = await _userManager.CreateAsync(user, model.Password);
        if (!createRes.Succeeded)
        {
            var errors = string.Join("; ", createRes.Errors.Select(e => e.Description));
            return new DbResponse { Success = false, Message = $"Identity errors: {errors}" };
        }

        if (!string.IsNullOrEmpty(model.Role))
        {
            var roleRes = await _userManager.AddToRoleAsync(user, model.Role);
            if (!roleRes.Succeeded)
            {
                var errors = string.Join("; ", roleRes.Errors.Select(e => e.Description));
                return new DbResponse { Success = false, Message = $"Role assignment errors: {errors}" };
            }
        }

        var refreshStorageStatus = await StoreRefreshToken(user.Id, refreshTokenHash);
        if (!refreshStorageStatus) return new DbResponse { Success = false, Message = "Refresh storage did not store" };
        return new DbResponse { Success = true };
    }

    /// Verifies username and password, then stores a new refresh token for the session.
    public async Task<DbLoginResponse> Login(LoginDto model, string tokenHash)
    {
        // trying to find the user. If anyone sees this is 2:35 AM
        var user = await _userManager.FindByNameAsync(model.Username);
        if (user == null) return new DbLoginResponse() { Success = false, Message = "Username or password is incorrect" };
        // trying to find the password
        var pwRes = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!pwRes) return new DbLoginResponse() { Success = false, Message = "Password is incorrect" };
        // storing the refresh token
        var refreshStorageStatus = await StoreRefreshToken(user.Id, tokenHash);
        // if something went wrong we alert the user
        if (!refreshStorageStatus) return new DbLoginResponse() { Success = false, Message = "Refresh storage did not store" };
        return new DbLoginResponse() { Success = true, User = user };
    }

    /// Looks up a stored refresh token hash and returns the associated user if the token is valid and not expired.
    public async Task<IsRefreshMatch> CheckTokenHash(string tokenHash)
    {
        // We are going to check if it's stored
        var stored = await _db.RefreshTokens
            .Include(rt => rt.AppUser)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
        if (stored is null) return new IsRefreshMatch
        {
            IsMatch = false,
            Message="Invalid refresh token."
        };
        if (stored.ExpiresAtUtc <= DateTime.UtcNow) return new IsRefreshMatch
        {
            IsMatch = false,
            Message="Refresh token expired."
        };
        return new IsRefreshMatch { IsMatch = true, Message = "Refresh token is good", User = stored.AppUser };
    }

    /// Marks the refresh token as revoked, preventing further use.
    public async Task<DbResponse> Logout(string refreshHash)
    {
        // Now we are going to make the deletion on the bd
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == refreshHash);
        if (stored != null && stored.RevokedAtUtc == null)
        {
            stored.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return new DbResponse { Success = true };
        }
        return new DbResponse { Success = false, Message = "Couldn't log out" };
    }
}
