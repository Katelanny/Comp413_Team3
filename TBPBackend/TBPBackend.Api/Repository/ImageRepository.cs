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

    /// Returns all image records across all users, ordered by creation date.
    public async Task<List<UserImage>> GetAllImagesAsync()
    {
        return await _context.UserImages
            .OrderBy(ui => ui.CreatedAtUtc)
            .ToListAsync();
    }

    /// Returns all images belonging to the given user, ordered by filename.
    public async Task<List<UserImage>> GetImagesByUserIdAsync(string userId)
    {
        return await _context.UserImages
            .Where(ui => ui.AppUserId == userId)
            .OrderBy(ui => ui.FileName)
            .ToListAsync();
    }

    /// Returns the image record matching the given user and filename, or null if not found.
    public async Task<UserImage?> GetImageByUserAndFilenameAsync(string userId, string filename)
    {
        return await _context.UserImages
            .FirstOrDefaultAsync(ui => ui.AppUserId == userId && ui.FileName == filename);
    }

    /// Persists a single image record and returns it.
    public async Task<UserImage> AddImageAsync(UserImage image)
    {
        _context.UserImages.Add(image);
        await _context.SaveChangesAsync();
        return image;
    }

    /// Adds image records for any filenames not already linked to the user. Skips duplicates.
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

    /// Adds image records with full metadata for any filenames not already linked to the user. Skips duplicates.
    public async Task<List<UserImage>> AddImagesWithMetadataAsync(string userId, List<ImageMetadata> images)
    {
        var existing = await _context.UserImages
            .Where(ui => ui.AppUserId == userId)
            .Select(ui => ui.FileName)
            .ToListAsync();

        var newImages = images
            .Where(i => !existing.Contains(i.FileName))
            .Select(i => new UserImage
            {
                AppUserId = userId,
                FileName = i.FileName,
                ModelName = i.ModelName,
                ImageIndex = i.Index,
                Count = i.Count,
                CameraAngle = i.CameraAngle,
                Height = i.Height,
                Width = i.Width,
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
