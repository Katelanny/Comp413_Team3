using Microsoft.EntityFrameworkCore;
using TBPBackend.Api.Data;
using TBPBackend.Api.Interfaces;
using TBPBackend.Api.Models.Tables;

namespace TBPBackend.Api.Repository;

public class ImageRepository : IImageRepository
{
    private readonly ApplicationDbContext _context;

    public ImageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserImage>> GetImagesByUserIdAsync(string userId)
    {
        return await _context.UserImages
            .Where(ui => ui.AppUserId == userId)
            .OrderBy(ui => ui.FileName)
            .ToListAsync();
    }

    public async Task<UserImage?> GetImageByUserAndFilenameAsync(string userId, string filename)
    {
        return await _context.UserImages
            .FirstOrDefaultAsync(ui => ui.AppUserId == userId && ui.FileName == filename);
    }

    public async Task<UserImage> AddImageAsync(UserImage image)
    {
        _context.UserImages.Add(image);
        await _context.SaveChangesAsync();
        return image;
    }

    public async Task<List<UserImage>> AddImagesAsync(string userId, List<string> filenames)
    {
        var existing = await _context.UserImages
            .Where(ui => ui.AppUserId == userId)
            .Select(ui => ui.FileName)
            .ToListAsync();

        var newImages = filenames
            .Where(f => !existing.Contains(f))
            .Select(f => new UserImage
            {
                AppUserId = userId,
                FileName = f,
                CreatedAtUtc = DateTime.UtcNow
            })
            .ToList();

        if (newImages.Count > 0)
        {
            _context.UserImages.AddRange(newImages);
            await _context.SaveChangesAsync();
        }

        return newImages;
    }
}
