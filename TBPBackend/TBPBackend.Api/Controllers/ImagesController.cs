using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/images")]
[Authorize]
public class ImagesController : ControllerBase
{
    private readonly IImageService _imageService;

    public ImagesController(IImageService imageService)
    {
        _imageService = imageService;
    }

    [HttpPost]
    public async Task<IActionResult> GetMyImages()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var images = await _imageService.GetAllImageUrlsAsync(userId);
        if (images.Count == 0)
            return Ok(new { message = "No images found for your account.", images = Array.Empty<object>() });

        return Ok(new { images });
    }

    [HttpPost("{filename}")]
    public async Task<IActionResult> GetMyImage(string filename)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _imageService.GetSingleImageUrlAsync(userId, filename);
        if (result is null)
            return NotFound(new { error = "Image not found or does not belong to you." });

        return Ok(result);
    }

    [HttpPost("link")]
    public async Task<IActionResult> LinkImages([FromBody] LinkImagesRequest request)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (request.Filenames is null || request.Filenames.Count == 0)
            return BadRequest(new { error = "Provide at least one filename." });

        var count = await _imageService.LinkImagesToUserAsync(userId, request.Filenames);
        return Ok(new { linked = count, message = $"{count} new image(s) linked to your account." });
    }

    [HttpPost("link-with-metadata")]
    public async Task<IActionResult> LinkImagesWithMetadata([FromBody] LinkImagesWithMetadataRequest request)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (request.Images is null || request.Images.Count == 0)
            return BadRequest(new { error = "Provide at least one image." });

        var count = await _imageService.LinkImagesWithMetadataAsync(userId, request.Images);
        return Ok(new { linked = count, message = $"{count} new image(s) linked to your account." });
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}

public class LinkImagesRequest
{
    public List<string> Filenames { get; set; } = new();
}

public class LinkImagesWithMetadataRequest
{
    public List<ImageMetadata> Images { get; set; } = new();
}
