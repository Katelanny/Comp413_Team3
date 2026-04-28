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

    /// Returns all images in the system with signed GCS URLs valid for 15 minutes.
    public async Task<List<ImageUrlResult>> GetAllImagesAsync()
    {
        var images = await _imageRepository.GetAllImagesAsync();
        var urlSigner = await CreateUrlSignerAsync();
        var results = new List<ImageUrlResult>();

        foreach (var img in images)
        {
            var signedUrl = await urlSigner.SignAsync(
                BucketName, img.FileName, TimeSpan.FromMinutes(15), HttpMethod.Get);

            results.Add(new ImageUrlResult(
                img.Id, img.FileName, signedUrl,
                img.ModelName, img.ImageIndex, img.Count,
                img.CameraAngle, img.Height, img.Width,
                img.CreatedAtUtc));
        }

        return results;
    }

    /// Returns all images belonging to the given user with signed GCS URLs valid for 15 minutes.
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
                img.Id, img.FileName, signedUrl,
                img.ModelName, img.ImageIndex, img.Count,
                img.CameraAngle, img.Height, img.Width,
                img.CreatedAtUtc));
        }

        return results;
    }

    /// Returns a single image for the given user and filename with a signed GCS URL, or null if not found.
    public async Task<ImageUrlResult?> GetSingleImageUrlAsync(string userId, string filename)
    {
        var image = await _imageRepository.GetImageByUserAndFilenameAsync(userId, filename);
        if (image is null) return null;

        var urlSigner = await CreateUrlSignerAsync();
        var signedUrl = await urlSigner.SignAsync(
            BucketName, image.FileName, TimeSpan.FromMinutes(15), HttpMethod.Get);

        return new ImageUrlResult(
            image.Id, image.FileName, signedUrl,
            image.ModelName, image.ImageIndex, image.Count,
            image.CameraAngle, image.Height, image.Width,
            image.CreatedAtUtc);
    }

    /// Associates a list of GCS filenames with the given user account. Returns the count of newly linked images.
    public async Task<int> LinkImagesToUserAsync(string userId, List<string> filenames)
    {
        var added = await _imageRepository.AddImagesAsync(userId, filenames);
        return added.Count;
    }

    /// Associates a list of images with full metadata to the given user account. Returns the count of newly linked images.
    public async Task<int> LinkImagesWithMetadataAsync(string userId, List<ImageMetadata> images)
    {
        var added = await _imageRepository.AddImagesWithMetadataAsync(userId, images);
        return added.Count;
    }

    private const string StorageServiceAccount =
        "backend-storage-admin@project-37ee58e8-38e4-4451-85a.iam.gserviceaccount.com";

    /// Builds a GCS UrlSigner using application default credentials, impersonating the storage
    /// service account when running with user credentials locally.
    private static async Task<UrlSigner> CreateUrlSignerAsync()
    {
        var credential = await GoogleCredential.GetApplicationDefaultAsync();

        if (credential.UnderlyingCredential is not Google.Apis.Auth.OAuth2.ServiceAccountCredential)
        {
            credential = credential.Impersonate(
                new Google.Apis.Auth.OAuth2.ImpersonatedCredential.Initializer(StorageServiceAccount)
                {
                    Scopes = ["https://www.googleapis.com/auth/devstorage.read_only"]
                });
        }

        return UrlSigner.FromCredential(credential);
    }
}
