using TBPBackend.Api.Dtos.Prediction;

namespace TBPBackend.Api.Interfaces;

public interface IPredictionService
{
    Task<PredictionResponseDto?> GetPredictionByImageIdAsync(long imageId);
}
