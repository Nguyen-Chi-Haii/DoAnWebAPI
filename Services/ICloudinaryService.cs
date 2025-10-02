public interface ICloudinaryService
{
    Task<(string fileUrl, string thumbnailUrl, long size, int width, int height)>
        UploadImageAsync(IFormFile file);
    Task<bool> DeleteImageAsync(string publicId);
}