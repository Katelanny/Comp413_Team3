using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TBPBackend.Api.Dtos.Prediction;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Controllers;

[ApiController]
[Route("api/prediction")]
public class PredictionController : ControllerBase
{
    private readonly IPredictionService _predictionService;

    public PredictionController(IPredictionService predictionService)
    {
        _predictionService = predictionService;
    }

    [HttpGet("{imageId:long}")]
    [Authorize(Policy = "DoctorOnly")]
    public async Task<ActionResult<PredictionResponseDto>> GetPredictionByImageId(long imageId)
    {
        var result = await _predictionService.GetPredictionByImageIdAsync(imageId);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
