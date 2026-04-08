namespace TBPBackend.Api.Interfaces;

public interface IImageService
{
    Task<List<ImageUrlResult>> GetAllImageUrlsAsync(string userId);
    Task<ImageUrlResult?> GetSingleImageUrlAsync(string userId, string filename);
    Task<int> LinkImagesToUserAsync(string userId, List<string> filenames);
    Task<int> LinkImagesWithMetadataAsync(string userId, List<ImageMetadata> images);
}

public record ImageUrlResult(
    string FileName,
    string SignedUrl,
    string? ModelName = null,
    int? Index = null,
    int? Count = null,
    string? CameraAngle = null,
    int? Height = null,
    int? Width = null,
    DateTime? DateTaken = null);
