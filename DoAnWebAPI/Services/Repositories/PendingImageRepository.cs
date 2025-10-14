using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.PendingImage;
using DoAnWebAPI.Services.Interface;

namespace DoAnWebAPI.Services.Repositories
{
    public class PendingImageRepository : IPendingImageRepository
    {
        private readonly FirebaseService _firebaseService;
        private const string Collection = "pending_images";

        public PendingImageRepository(FirebaseService firebaseService)
        {
            _firebaseService = firebaseService;
        }

        public async Task<List<PendingImage>> GetAllAsync()
        {
            try
            {
                var dict = await _firebaseService.GetDataAsync<Dictionary<string, PendingImage>>(Collection);
                return dict?.Values.ToList() ?? new List<PendingImage>();
            }
            catch (Exception ex)
            {
                // Log và return empty hoặc throw custom
                return new List<PendingImage>(); // Hoặc throw nếu critical
            }
        }

        public async Task<PendingImage?> GetByIdAsync(int id)
        {
            // First, try direct path
            var directPath = $"{Collection}/image_{id}";
            var image = await _firebaseService.GetDataAsync<PendingImage>(directPath);
            if (image != null && image.Id == id)
            {
                return image;
            }

            try
            {
                var allImages = await GetAllAsync();
                return allImages.FirstOrDefault(img => img.Id == id);
            }
            catch (Exception ex)
            {
                // Log error
                return null;
            }
        }

        public async Task<PendingImage?> CreateAsync(PendingImage newImage) // Thay đổi tham số
        {
            try
            {
                newImage.Id = GenerateId(); // Gán ID tự động
                newImage.SubmittedAt = DateTime.UtcNow; // Đảm bảo thời gian đúng
                newImage.Status = "pending"; // Đặt status mặc định

                var key = $"image_{newImage.Id}";
                await _firebaseService.SetDataAsync($"{Collection}/{key}", newImage);
                return newImage;
            }
            catch (Exception ex)
            {
                // Log error
                return null;
            }
        }

        public async Task<PendingImage?> UpdateStatusAsync(int id, string status, DateTime? reviewedAt)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null) return null;

                existing.Status = status;
                existing.ReviewedAt = reviewedAt ?? DateTime.UtcNow;

                var key = $"image_{id}";
                await _firebaseService.SetDataAsync($"{Collection}/{key}", existing);
                return existing;
            }
            catch (Exception ex)
            {
                // Log error
                return null;
            }
        }

        private int GenerateId()
        {
            // Simple ID generation; in production, use a more robust method like querying Firebase for max ID + 1
            return new Random().Next(1, 99999); // Placeholder
        }
    }
}
