namespace TBPBackend.Api.Interfaces;

public interface IImageService
{
    Task<List<ImageUrlResult>> GetAllImageUrlsAsync(string userId);
    Task<string?> GetSingleImageUrlAsync(string userId, string filename);
    Task<int> LinkImagesToUserAsync(string userId, List<string> filenames);
}

public record ImageUrlResult(string FileName, string SignedUrl);
