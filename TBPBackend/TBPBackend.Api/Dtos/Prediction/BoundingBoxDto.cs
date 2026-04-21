using Newtonsoft.Json;

namespace TBPBackend.Api.Dtos.Prediction;

public class BoundingBoxDto
{
    [JsonProperty("x1")]
    public float X1 { get; set; }

    [JsonProperty("y1")]
    public float Y1 { get; set; }

    [JsonProperty("x2")]
    public float X2 { get; set; }

    [JsonProperty("y2")]
    public float Y2 { get; set; }
}
