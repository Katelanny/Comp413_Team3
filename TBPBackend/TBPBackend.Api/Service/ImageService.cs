using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;
using TBPBackend.Api.Interfaces;

namespace TBPBackend.Api.Service;

public class ImageService : IImageService
{
    private readonly IImageRepository _imageRepository;
    private const string BucketName = "comp-413-class";

    public ImageService(IImageRepository imageRepository)
    {
        _imageRepository = imageRepository;
    }

    public async Task<List<ImageUrlResult>> GetAllImageUrlsAsync(string userId)
    {
        var images = await _imageRepository.GetImagesByUserIdAsync(userId);
        var results = new List<ImageUrlResult>();

        var urlSigner = await CreateUrlSignerAsync();

        foreach (var img in images)
        {
            var signedUrl = await urlSigner.SignAsync(
                BucketName, img.FileName, TimeSpan.FromMinutes(15), HttpMethod.Get);

            results.Add(new ImageUrlResult(
                img.FileName, signedUrl,
                img.ModelName, img.ImageIndex, img.Count,
                img.CameraAngle, img.Height, img.Width,
                img.CreatedAtUtc));
        }

        return results;
    }

    public async Task<ImageUrlResult?> GetSingleImageUrlAsync(string userId, string filename)
    {
        var image = await _imageRepository.GetImageByUserAndFilenameAsync(userId, filename);
        if (image is null) return null;

        var urlSigner = await CreateUrlSignerAsync();
        var signedUrl = await urlSigner.SignAsync(
            BucketName, image.FileName, TimeSpan.FromMinutes(15), HttpMethod.Get);

        return new ImageUrlResult(
            image.FileName, signedUrl,
            image.ModelName, image.ImageIndex, image.Count,
            image.CameraAngle, image.Height, image.Width,
            image.CreatedAtUtc);
    }

    public async Task<int> LinkImagesToUserAsync(string userId, List<string> filenames)
    {
        var added = await _imageRepository.AddImagesAsync(userId, filenames);
        return added.Count;
    }

    public async Task<int> LinkImagesWithMetadataAsync(string userId, List<ImageMetadata> images)
    {
        var added = await _imageRepository.AddImagesWithMetadataAsync(userId, images);
        return added.Count;
    }

    private static async Task<UrlSigner> CreateUrlSignerAsync()
    {
        var credential = await GoogleCredential.GetApplicationDefaultAsync();
        return UrlSigner.FromCredential(credential);
    }
}
