using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Interfaces;

public interface IImageRepository
{
    Task<List<UserImage>> GetImagesByUserIdAsync(string userId);
    Task<UserImage?> GetImageByUserAndFilenameAsync(string userId, string filename);
    Task<UserImage> AddImageAsync(UserImage image);
    Task<List<UserImage>> AddImagesAsync(string userId, List<string> filenames);
    Task<List<UserImage>> AddImagesWithMetadataAsync(string userId, List<ImageMetadata> images);
}

public class ImageMetadata
{
    public string FileName { get; set; } = null!;
    public string? ModelName { get; set; }
    public int? Index { get; set; }
    public int? Count { get; set; }
    public string? CameraAngle { get; set; }
    public int? Height { get; set; }
    public int? Width { get; set; }
}
