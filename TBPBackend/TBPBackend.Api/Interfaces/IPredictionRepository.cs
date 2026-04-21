using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Interfaces;

public interface IPredictionRepository
{
    Task<UserImage?> GetUserImageByIdAsync(long imageId);
    Task<ImagePrediction?> GetLatestPredictionByImageIdAsync(long imageId);
}
