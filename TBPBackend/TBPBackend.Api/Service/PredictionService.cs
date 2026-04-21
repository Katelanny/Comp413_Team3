using Newtonsoft.Json;
using TBPBackend.Api.Dtos.Prediction;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Service;

public class PredictionService : IPredictionService
{
    private readonly IPredictionRepository _repo;

    public PredictionService(IPredictionRepository repo)
    {
        _repo = repo;
    }

    public async Task<PredictionResponseDto?> GetPredictionByImageIdAsync(long imageId)
    {
        var image = await _repo.GetUserImageByIdAsync(imageId);
        if (image == null) return null;

        var prediction = await _repo.GetLatestPredictionByImageIdAsync(imageId);

        var lesions = prediction?.LesionDetections
            .OrderBy(ld => ld.Id)
            .Select(ld => new LesionDto
            {
                LesionId = ld.LesionId,
                Box = new BoundingBoxDto
                {
                    X1 = ld.BoxX1,
                    Y1 = ld.BoxY1,
                    X2 = ld.BoxX2,
                    Y2 = ld.BoxY2,
                },
                Score = ld.Score,
                PolygonMask = JsonConvert.DeserializeObject<List<List<float>>>(ld.PolygonMask) ?? [],
                AnatomicalSite = ld.AnatomicalSite,
                PrevLesionId = ld.PrevLesionId,
                RelativeSizeChange = ld.RelativeSizeChange,
            })
            .ToList() ?? [];

        return new PredictionResponseDto
        {
            PatientId = image.AppUserId,
            Predictions = prediction == null ? [] :
            [
                new ImagePredictionDto
                {
                    ImgId = imageId.ToString(),
                    Timestamp = image.CreatedAtUtc,
                    NumLesions = prediction.NumLesions,
                    Lesions = lesions,
                }
            ],
        };
    }
}
