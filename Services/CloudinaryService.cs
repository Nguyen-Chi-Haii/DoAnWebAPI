using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace DoAnWebAPI.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var cloudName = config["Cloudinary:CloudName"];
            var apiKey = config["Cloudinary:ApiKey"];
            var apiSecret = config["Cloudinary:ApiSecret"];

            Console.WriteLine($"Cloudinary Config - Name: {cloudName}, Key: {apiKey?.Substring(0, 5)}...");

            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
            _cloudinary.Api.Secure = true; // Force HTTPS
        }

        public async Task<(string fileUrl, string thumbnailUrl, long size, int width, int height)>
        UploadImageAsync(IFormFile file)
        {
            MemoryStream memoryStream = null;
            try
            {
                memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, memoryStream),
                    Folder = "photo-gallery",
                    UseFilename = true,
                    UniqueFilename = true,
                    Overwrite = false,
                    Transformation = new Transformation().Width(800).Height(600).Crop("limit") // Giới hạn kích thước
                };

                Console.WriteLine("Calling Cloudinary API...");
                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult?.Error != null)
                {
                    throw new Exception($"Cloudinary upload failed: {uploadResult.Error.Message}");
                }

                if (uploadResult?.SecureUrl == null)
                {
                    throw new Exception("Upload failed: No URL returned from Cloudinary");
                }

                return (
                    fileUrl: uploadResult.SecureUrl.ToString(),
                    thumbnailUrl: uploadResult.SecureUrl.ToString(),
                    size: uploadResult.Bytes,
                    width: uploadResult.Width,
                    height: uploadResult.Height
                );
            }
            finally
            {
                memoryStream?.Dispose();
            }
        }

        public async Task<bool> DeleteImageAsync(string publicId)
        {
            var deletionParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deletionParams);
            return result.Result == "ok";
        }
    }
}