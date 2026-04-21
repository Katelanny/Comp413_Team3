using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Repository;

public class PredictionRepository : IPredictionRepository
{
    private readonly ApplicationDbContext _context;

    public PredictionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserImage?> GetUserImageByIdAsync(long imageId)
    {
        return await _context.UserImages.FindAsync(imageId);
    }

    public async Task<ImagePrediction?> GetLatestPredictionByImageIdAsync(long imageId)
    {
        return await _context.ImagePredictions
            .Include(p => p.LesionDetections)
            .Where(p => p.UserImageId == imageId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .FirstOrDefaultAsync();
    }
}
