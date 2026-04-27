using Microsoft.AspNetCore.Http;
using TBPBackend.Api.Models.Auth;

namespace TBPBackend.Tests;

public class ServiceResponseTests
{
    [Fact]
    public void Ok_SetsSuccessTrue()
    {
        var response = ServiceResponse.Ok("refresh", new CookieOptions(), "access");
        Assert.True(response.Success);
    }

    [Fact]
    public void Ok_SetsRefreshToken()
    {
        var response = ServiceResponse.Ok("my-refresh", new CookieOptions(), "my-access");
        Assert.Equal("my-refresh", response.RefreshToken);
    }

    [Fact]
    public void Ok_SetsAccessToken()
    {
        var response = ServiceResponse.Ok("r", new CookieOptions(), "my-access-token");
        Assert.Equal("my-access-token", response.AccessToken);
    }

    [Fact]
    public void Ok_SetsCookieOptions()
    {
        var options = new CookieOptions { HttpOnly = true };
        var response = ServiceResponse.Ok("r", options, "a");
        Assert.Same(options, response.CookieOptions);
    }

    [Fact]
    public void Ok_NullMessage()
    {
        var response = ServiceResponse.Ok("r", new CookieOptions(), "a");
        Assert.Null(response.Message);
    }

    [Fact]
    public void Fail_SetsSuccessFalse()
    {
        var response = ServiceResponse.Fail("error message");
        Assert.False(response.Success);
    }

    [Fact]
    public void Fail_SetsMessage()
    {
        var response = ServiceResponse.Fail("something went wrong");
        Assert.Equal("something went wrong", response.Message);
    }

    [Fact]
    public void Fail_NullRefreshToken()
    {
        Assert.Null(ServiceResponse.Fail("error").RefreshToken);
    }

    [Fact]
    public void Fail_NullCookieOptions()
    {
        Assert.Null(ServiceResponse.Fail("error").CookieOptions);
    }

    [Fact]
    public void Ok_MultipleCallsProduceIndependentInstances()
    {
        var r1 = ServiceResponse.Ok("token-1", new CookieOptions(), "access-1");
        var r2 = ServiceResponse.Ok("token-2", new CookieOptions(), "access-2");
        Assert.NotEqual(r1.RefreshToken, r2.RefreshToken);
        Assert.NotEqual(r1.AccessToken, r2.AccessToken);
    }
}
