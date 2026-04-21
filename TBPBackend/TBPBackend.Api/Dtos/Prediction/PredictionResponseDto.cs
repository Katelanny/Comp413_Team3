using Newtonsoft.Json;

namespace TBPBackend.Api.Dtos.Prediction;

public class PredictionResponseDto
{
    [JsonProperty("patient_id")]
    public string PatientId { get; set; } = null!;

    [JsonProperty("predictions")]
    public List<ImagePredictionDto> Predictions { get; set; } = [];

    [JsonProperty("errors")]
    public List<object> Errors { get; set; } = [];
}
