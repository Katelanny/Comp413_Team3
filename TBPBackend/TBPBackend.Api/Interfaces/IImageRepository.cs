using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Interfaces;

public interface IImageRepository
{
    Task<List<UserImage>> GetImagesByUserIdAsync(string userId);
    Task<UserImage?> GetImageByUserAndFilenameAsync(string userId, string filename);
    Task<UserImage> AddImageAsync(UserImage image);
    Task<List<UserImage>> AddImagesAsync(string userId, List<string> filenames);
}
