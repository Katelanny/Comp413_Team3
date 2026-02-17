using Microsoft.AspNetCore.Identity;

namespace TBPBackend.Api.Models;

public class AppUser : IdentityUser
{
    public bool TestField { get; set; }
}