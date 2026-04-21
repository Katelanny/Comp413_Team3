using Newtonsoft.Json;

namespace TBPBackend.Api.Dtos.Prediction;

public class ImagePredictionDto
{
    [JsonProperty("img_id")]
    public string ImgId { get; set; } = null!;

    [JsonProperty("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonProperty("num_lesions")]
    public int NumLesions { get; set; }

    [JsonProperty("lesions")]
    public List<LesionDto> Lesions { get; set; } = [];
}
