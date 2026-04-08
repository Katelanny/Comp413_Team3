using Microsoft.AspNetCore.Identity;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Models;

public class AppUser : IdentityUser
{
    public bool TestField { get; set; }

    public virtual Patient? Patient { get; set; }
    public virtual Doctor? Doctor { get; set; }
    public virtual Admin? Admin { get; set; }
    public virtual ICollection<UserImage> Images { get; set; } = new List<UserImage>();
}
