using System.ComponentModel.DataAnnotations;

namespace TBPBackend.Api.Dtos.Account;

public class LoginDto
{
    [Required]
    public required string Username { get; set; }
    [Required]
    public required string Password { get; set; }
}