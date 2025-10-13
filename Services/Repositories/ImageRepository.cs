using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using Firebase.Database;
using Firebase.Database.Query;
using FirebaseWebApi.Models;

namespace DoAnWebAPI.Services.Repositories
{
    public class ImageRepository : IImageRepository
    {
        private readonly FirebaseClient _firebase;
        private readonly ICloudinaryService _cloudinaryService;

        public ImageRepository(FirebaseClient firebase, ICloudinaryService cloudinaryService)
        {
            _firebase = firebase;
            _cloudinaryService = cloudinaryService;
        }
        public async Task<ImageDTO> CreateAsync(CreateImageDTO dto, string fileUrl,string thumbnailUrl,long size,int width,int height)
        {
            var image = new Image
            {
                Id = new Random().Next(1, 999999), // Firebase auto-gen cũng được
                UserId = dto.UserId,
                Title = dto.Title,
                Description = dto.Description,
                FileUrl = fileUrl,
                ThumbnailUrl = thumbnailUrl,
                SizeBytes = size,
                Width = width,
                Height = height,
                IsPublic = dto.IsPublic,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _firebase
                .Child("images")
                .Child(image.Id.ToString())
                .PutAsync(image);

            return new ImageDTO
            {
                Id = image.Id,
                UserId = image.UserId,
                Title = image.Title,
                FileUrl = image.FileUrl,
                ThumbnailUrl = image.ThumbnailUrl,
                IsPublic = image.IsPublic,
                Status = image.Status,
                Tags = new List<TagDTO>(),
                Topics = new List<TopicDTO>()
            };
        }


        public async Task<bool> DeleteAsync(int id) 
        {
            var existing = await _firebase.Child("images").Child(id.ToString()).OnceSingleAsync<Image>();
            if (existing == null) return false;

            await _firebase.Child("images").Child(id.ToString()).DeleteAsync();
            // Nếu muốn, gọi thêm Cloudinary API để xóa file gốc + thumbnail
            return true;
        }

        public async Task<IEnumerable<ImageDTO>> GetAllAsync()
        {
            var data = await _firebase
               .Child("images")
               .OnceAsync<Image>();

            return data.Select(d => new ImageDTO
            {
                Id = d.Object.Id,
                UserId = d.Object.UserId,
                Title = d.Object.Title,
                FileUrl = d.Object.FileUrl,
                ThumbnailUrl = d.Object.ThumbnailUrl,
                IsPublic = d.Object.IsPublic,
                Status = d.Object.Status,
                Tags = new List<TagDTO>(),    // TODO: Map Tag nếu có
                Topics = new List<TopicDTO>() // TODO: Map Topic nếu có
            }).ToList();
        }

        public async Task<ImageDTO> GetByIdAsync(int id)
        {
            var image = await _firebase
                .Child("images")
                .Child(id.ToString())
                .OnceSingleAsync<Image>();

            if (image == null) return null;

            return new ImageDTO
            {
                Id = image.Id,
                UserId = image.UserId,
                Title = image.Title,
                FileUrl = image.FileUrl,
                ThumbnailUrl = image.ThumbnailUrl,
                IsPublic = image.IsPublic,
                Status = image.Status,
                Tags = new List<TagDTO>(),
                Topics = new List<TopicDTO>()
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateImageDTO dto) 
        {
            var existing = await _firebase.Child("images").Child(id.ToString()).OnceSingleAsync<Image>();
            if (existing == null) return false;

            existing.Title = dto.Title ?? existing.Title;
            existing.Description = dto.Description ?? existing.Description;
            existing.IsPublic = dto.IsPublic ?? existing.IsPublic;
            existing.Status = dto.Status ?? existing.Status;
            existing.UpdatedAt = DateTime.UtcNow;

            await _firebase
                .Child("images")
                .Child(id.ToString())
                .PutAsync(existing);

            return true;
        }
    }
}
