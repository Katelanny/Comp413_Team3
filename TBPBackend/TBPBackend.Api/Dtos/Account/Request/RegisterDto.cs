using System.ComponentModel.DataAnnotations;

namespace TBPBackend.Api.Dtos.Account;

public class RegisterDto
{
    [Required]
    public string? Username { get; set; }
    [Required]
    public string? Password { get; set; }
    [Required]
    public string? Email { get; set; }

    public string? Role { get; set; }
}
