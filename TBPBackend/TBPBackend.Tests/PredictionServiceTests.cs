using Moq;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models.Tables;
using TBPBackend.Api.Service;

namespace TBPBackend.Tests;

public class PredictionServiceTests
{
    private static UserImage MakeImage(long id = 1, string userId = "user-1") =>
        new() { Id = id, AppUserId = userId, FileName = $"img{id}.jpg", CreatedAtUtc = DateTime.UtcNow };

    private static LesionDetection MakeLesion(long id, string lesionId, string mask = "[]") =>
        new()
        {
            Id = id, LesionId = lesionId,
            BoxX1 = 1f, BoxY1 = 2f, BoxX2 = 3f, BoxY2 = 4f,
            Score = 0.9f, PolygonMask = mask,
            CreatedAtUtc = DateTime.UtcNow
        };

    [Fact]
    public async Task GetPredictionByImageIdAsync_ReturnsNull_WhenImageNotFound()
    {
        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(99)).ReturnsAsync((UserImage?)null);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(99);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetPredictionByImageIdAsync_ReturnsEmptyPredictions_WhenNoPredictionExists()
    {
        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(1)).ReturnsAsync(MakeImage());
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(1)).ReturnsAsync((ImagePrediction?)null);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("user-1", result.PatientId);
        Assert.Empty(result.Predictions);
    }

    [Fact]
    public async Task GetPredictionByImageIdAsync_ReturnsMappedPrediction_WhenPredictionExists()
    {
        var now = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc);
        var image = new UserImage { Id = 2, AppUserId = "user-2", FileName = "img.jpg", CreatedAtUtc = now };
        var prediction = new ImagePrediction
        {
            Id = 10, UserImageId = 2, NumLesions = 1, CreatedAtUtc = now,
            LesionDetections = new List<LesionDetection>
            {
                new()
                {
                    Id = 100, LesionId = "2_0",
                    BoxX1 = 10f, BoxY1 = 20f, BoxX2 = 30f, BoxY2 = 40f,
                    Score = 0.95f, PolygonMask = "[[1.0,2.0],[3.0,4.0]]",
                    AnatomicalSite = "arm", PrevLesionId = "1_0", RelativeSizeChange = 0.1f,
                    CreatedAtUtc = now
                }
            }
        };

        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(2)).ReturnsAsync(image);
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(2)).ReturnsAsync(prediction);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(2);

        Assert.NotNull(result);
        Assert.Equal("user-2", result.PatientId);
        Assert.Single(result.Predictions);

        var imgPred = result.Predictions[0];
        Assert.Equal("2", imgPred.ImgId);
        Assert.Equal(now, imgPred.Timestamp);
        Assert.Equal(1, imgPred.NumLesions);
        Assert.Single(imgPred.Lesions);

        var lesion = imgPred.Lesions[0];
        Assert.Equal("2_0", lesion.LesionId);
        Assert.Equal(0.95f, lesion.Score);
        Assert.Equal(10f, lesion.Box.X1);
        Assert.Equal(20f, lesion.Box.Y1);
        Assert.Equal(30f, lesion.Box.X2);
        Assert.Equal(40f, lesion.Box.Y2);
        Assert.Equal("arm", lesion.AnatomicalSite);
        Assert.Equal("1_0", lesion.PrevLesionId);
        Assert.Equal(0.1f, lesion.RelativeSizeChange);
    }

    [Fact]
    public async Task GetPredictionByImageIdAsync_LesionsOrderedById()
    {
        var image = MakeImage(3, "user-3");
        var prediction = new ImagePrediction
        {
            Id = 11, UserImageId = 3, NumLesions = 2, CreatedAtUtc = DateTime.UtcNow,
            LesionDetections = new List<LesionDetection>
            {
                MakeLesion(200, "3_1"),
                MakeLesion(100, "3_0"),
            }
        };

        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(3)).ReturnsAsync(image);
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(3)).ReturnsAsync(prediction);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(3);

        var lesions = result!.Predictions[0].Lesions;
        Assert.Equal("3_0", lesions[0].LesionId); // Id=100 sorts first
        Assert.Equal("3_1", lesions[1].LesionId); // Id=200 sorts second
    }

    [Fact]
    public async Task GetPredictionByImageIdAsync_ParsesPolygonMaskJson()
    {
        var image = MakeImage(4, "u");
        var prediction = new ImagePrediction
        {
            Id = 12, UserImageId = 4, NumLesions = 1, CreatedAtUtc = DateTime.UtcNow,
            LesionDetections = new List<LesionDetection>
            {
                MakeLesion(1, "4_0", "[[1.5,2.5],[3.5,4.5]]")
            }
        };

        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(4)).ReturnsAsync(image);
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(4)).ReturnsAsync(prediction);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(4);

        var mask = result!.Predictions[0].Lesions[0].PolygonMask;
        Assert.Equal(2, mask.Count);
        Assert.Equal(1.5f, mask[0][0]);
        Assert.Equal(2.5f, mask[0][1]);
        Assert.Equal(3.5f, mask[1][0]);
        Assert.Equal(4.5f, mask[1][1]);
    }

    [Fact]
    public async Task GetPredictionByImageIdAsync_EmptyPolygonMask_ParsesToEmptyList()
    {
        var image = MakeImage(5, "u");
        var prediction = new ImagePrediction
        {
            Id = 13, UserImageId = 5, NumLesions = 1, CreatedAtUtc = DateTime.UtcNow,
            LesionDetections = new List<LesionDetection> { MakeLesion(1, "5_0", "[]") }
        };

        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(5)).ReturnsAsync(image);
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(5)).ReturnsAsync(prediction);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(5);

        Assert.Empty(result!.Predictions[0].Lesions[0].PolygonMask);
    }

    [Fact]
    public async Task GetPredictionByImageIdAsync_NullFieldsPassedThrough()
    {
        var image = MakeImage(6, "u");
        var prediction = new ImagePrediction
        {
            Id = 14, UserImageId = 6, NumLesions = 1, CreatedAtUtc = DateTime.UtcNow,
            LesionDetections = new List<LesionDetection>
            {
                new()
                {
                    Id = 1, LesionId = "6_0",
                    BoxX1 = 0, BoxY1 = 0, BoxX2 = 1, BoxY2 = 1,
                    Score = 0.5f, PolygonMask = "[]",
                    AnatomicalSite = null, PrevLesionId = null, RelativeSizeChange = null,
                    CreatedAtUtc = DateTime.UtcNow
                }
            }
        };

        var repo = new Mock<IPredictionRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetUserImageByIdAsync(6)).ReturnsAsync(image);
        repo.Setup(r => r.GetLatestPredictionByImageIdAsync(6)).ReturnsAsync(prediction);

        var result = await new PredictionService(repo.Object).GetPredictionByImageIdAsync(6);

        var lesion = result!.Predictions[0].Lesions[0];
        Assert.Null(lesion.AnatomicalSite);
        Assert.Null(lesion.PrevLesionId);
        Assert.Null(lesion.RelativeSizeChange);
    }
}
