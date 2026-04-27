using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models;
using TBPBackend.Api.Models.Auth;
using TBPBackend.Api.Models.Tables;
using TBPBackend.Api.Service;

namespace TBPBackend.Tests;

public class ConcurrencyTests
{
    private static TokenService CreateTokenService() =>
        new(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                ["Jwt:Issuer"]    = "TestIssuer",
                ["Jwt:Audience"]  = "TestAudience",
            })
            .Build());

    // ── TokenService ──────────────────────────────────────────────────────────

    [Fact]
    public async Task HashRefreshToken_ConcurrentCallsSameInput_AllReturnSameHash()
    {
        var svc = CreateTokenService();
        const string input = "consistent-token-input";

        var results = await Task.WhenAll(
            Enumerable.Range(0, 50).Select(_ => Task.Run(() => svc.HashRefreshToken(input))));

        Assert.True(results.All(r => r == results[0]),
            "All concurrent hashes of the same input must be identical.");
    }

    [Fact]
    public async Task CreateRefreshToken_ConcurrentCalls_AllTokensUnique()
    {
        var svc = CreateTokenService();

        var results = await Task.WhenAll(
            Enumerable.Range(0, 100).Select(_ => Task.Run(() => svc.CreateRefreshToken())));

        Assert.Equal(100, results.Distinct().Count());
    }

    [Fact]
    public async Task CreateAccessToken_ConcurrentCallsDifferentUsers_AllDistinctTokens()
    {
        var svc = CreateTokenService();
        var users = Enumerable.Range(0, 20).Select(i => new AppUser
        {
            Id = $"user-{i}", Email = $"user{i}@example.com", UserName = $"user{i}"
        }).ToList();

        var tokens = await Task.WhenAll(
            users.Select(u => Task.Run(() => svc.CreateAccessToken(u))));

        Assert.Equal(20, tokens.Distinct().Count());
        Assert.True(tokens.All(t => !string.IsNullOrWhiteSpace(t)));
    }

    [Fact]
    public async Task HashRefreshToken_ConcurrentCallsDifferentInputs_AllDistinctHashes()
    {
        var svc = CreateTokenService();
        var inputs = Enumerable.Range(0, 30).Select(i => $"token-{i}").ToList();

        var results = await Task.WhenAll(
            inputs.Select(input => Task.Run(() => svc.HashRefreshToken(input))));

        Assert.Equal(30, results.Distinct().Count());
    }

    // ── PredictionService ─────────────────────────────────────────────────────

    [Fact]
    public async Task PredictionService_ConcurrentCallsSameImage_AllReturnConsistentResult()
    {
        var image = new UserImage { Id = 1, AppUserId = "u-concurrent", FileName = "scan.jpg", CreatedAtUtc = DateTime.UtcNow };
        var prediction = new ImagePrediction
        {
            Id = 1, UserImageId = 1, NumLesions = 3, CreatedAtUtc = DateTime.UtcNow,
            LesionDetections = new List<LesionDetection>()
        };

        var repo = new Mock<IPredictionRepository>();
        repo.Setup(r => r.GetUserImageByIdAsync(1)).ReturnsAsync(image);
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(1)).ReturnsAsync(prediction);

        var svc = new PredictionService(repo.Object);

        var results = await Task.WhenAll(
            Enumerable.Range(0, 20).Select(_ => svc.GetPredictionByImageIdAsync(1)));

        Assert.True(results.All(r => r != null), "All concurrent calls must return a result.");
        Assert.True(results.All(r => r!.PatientId == "u-concurrent"), "PatientId must be consistent.");
        Assert.True(results.All(r => r!.Predictions.Count == 1), "Each result must have one prediction.");
    }

    [Fact]
    public async Task PredictionService_ConcurrentCallsMissingImage_AllReturnNull()
    {
        var repo = new Mock<IPredictionRepository>();
        repo.Setup(r => r.GetUserImageByIdAsync(It.IsAny<long>())).ReturnsAsync((UserImage?)null);

        var svc = new PredictionService(repo.Object);

        var results = await Task.WhenAll(
            Enumerable.Range(0, 20).Select(_ => svc.GetPredictionByImageIdAsync(999)));

        Assert.True(results.All(r => r == null));
    }

    // ── ServiceResponse ───────────────────────────────────────────────────────

    [Fact]
    public async Task ServiceResponse_ConcurrentOkCreation_AllSucceedIndependently()
    {
        var sharedOptions = new CookieOptions { HttpOnly = true };

        var results = await Task.WhenAll(
            Enumerable.Range(0, 50).Select(i => Task.Run(() =>
                ServiceResponse.Ok($"refresh-{i}", sharedOptions, $"access-{i}"))));

        Assert.True(results.All(r => r.Success));
        Assert.Equal(50, results.Select(r => r.RefreshToken).Distinct().Count());
        Assert.Equal(50, results.Select(r => r.AccessToken).Distinct().Count());
    }

    [Fact]
    public async Task ServiceResponse_ConcurrentFailCreation_AllFail()
    {
        var results = await Task.WhenAll(
            Enumerable.Range(0, 50).Select(i => Task.Run(() =>
                ServiceResponse.Fail($"error-{i}"))));

        Assert.True(results.All(r => !r.Success));
        Assert.True(results.All(r => r.Message != null));
    }
}
