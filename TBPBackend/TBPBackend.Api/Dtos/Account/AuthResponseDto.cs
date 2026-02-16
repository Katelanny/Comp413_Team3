using System.ComponentModel.DataAnnotations;
namespace TBPBackend.Api.Dtos.Account;

public class AuthResponseDto
{
    [Required]
    public required string Token { get; set; }
    
}