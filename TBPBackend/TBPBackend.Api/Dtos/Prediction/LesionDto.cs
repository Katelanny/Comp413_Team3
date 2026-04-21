using Newtonsoft.Json;

namespace TBPBackend.Api.Dtos.Prediction;

public class LesionDto
{
    [JsonProperty("lesion_id")]
    public string LesionId { get; set; } = null!;

    [JsonProperty("box")]
    public BoundingBoxDto Box { get; set; } = null!;

    [JsonProperty("score")]
    public float Score { get; set; }

    [JsonProperty("polygon_mask")]
    public List<List<float>> PolygonMask { get; set; } = [];

    [JsonProperty("anatomical_site")]
    public string? AnatomicalSite { get; set; }

    [JsonProperty("prev_lesion_id")]
    public string? PrevLesionId { get; set; }

    [JsonProperty("relative_size_change")]
    public float? RelativeSizeChange { get; set; }
}
