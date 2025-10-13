using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using FireSharp;
using FireSharp.Response;
using FirebaseWebApi.Models; // Namespace chứa Image model
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace DoAnWebAPI.Services.Repositories
{
    public class ImageRepository : IImageRepository
    {
        private readonly FireSharp.FirebaseClient _firebase;
        private readonly ICloudinaryService _cloudinaryService;
        private const string Collection = "images";

        public ImageRepository(FireSharp.FirebaseClient firebase, ICloudinaryService cloudinaryService)
        {
            _firebase = firebase;
            _cloudinaryService = cloudinaryService;
        }

        private string GetPath(string id) => $"{Collection}/{id}";
        private string GetCollectionPath() => Collection;

        // Helper để ánh xạ từ Domain Model sang DTO (Đã sửa)
        private ImageDTO? MapToDTO(Image image)
        {
            if (image == null) return null;

            return new ImageDTO
            {
                Id = image.Id,
                UserId = image.UserId,
                Title = image.Title,
                Description = image.Description, // ✅ ĐÃ SỬA: Ánh xạ Description
                FileUrl = image.FileUrl,
                ThumbnailUrl = image.ThumbnailUrl,
                IsPublic = image.IsPublic,
                Status = image.Status,
                Tags = new List<TagDTO>(),
                Topics = new List<TopicDTO>()
            };
        }

        public async Task<ImageDTO> CreateAsync(
            int userId,
            string title,
            string? description,
            bool isPublic,
            List<int> tagIds,
            List<int> topicIds,
            string fileUrl,
            string thumbnailUrl,
            long size,
            int width,
            int height
        )
        {
            var image = new Image
            {
                Id = new Random().Next(1, 999999),
                UserId = userId,
                Title = title,
                Description = description ?? string.Empty,
                FileUrl = fileUrl,
                ThumbnailUrl = thumbnailUrl,
                SizeBytes = size,
                Width = width,
                Height = height,
                IsPublic = isPublic,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _firebase.SetAsync(GetPath(image.Id.ToString()), image);
            return MapToDTO(image)!;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var checkResponse = await _firebase.GetAsync(GetPath(id));
            if (checkResponse.Body == "null") return false;

            await _firebase.DeleteAsync(GetPath(id));
            return true;
        }

        // ✅ ĐÃ SỬA: GetAllAsync (Xử lý Dictionary Deserialization và Logging)
        public async Task<IEnumerable<ImageDTO>> GetAllAsync()
        {
            var response = await _firebase.GetAsync(GetCollectionPath());

            if (response.Body == "null" || string.IsNullOrWhiteSpace(response.Body))
                return new List<ImageDTO>();

            try
            {
                var data = response.ResultAs<Dictionary<string, Image>>();

                if (data == null)
                {
                    Console.WriteLine("ImageRepository Error: Deserialization failed for images collection.");
                    Console.WriteLine($"Raw Firebase response body: {response.Body}");
                    return new List<ImageDTO>();
                }

                return data.Values
                       .Where(d => d != null)
                       .Select(MapToDTO)
                       .Where(dto => dto != null)
                       .ToList()!;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ImageRepository Error: Exception during GetAllAsync: {ex.Message}");
                return new List<ImageDTO>();
            }
        }

        // ✅ ĐÃ SỬA: GetByIdAsync (Xử lý Deserialization và Logging)
        public async Task<ImageDTO?> GetByIdAsync(string id)
        {
            var path = GetPath(id);
            var response = await _firebase.GetAsync(path);

            if (response.Body == "null")
            {
                Console.WriteLine($"ImageRepository Info: Image ID {id} not found at path {path}.");
                return null;
            }

            try
            {
                var image = response.ResultAs<Image>();

                if (image == null)
                {
                    Console.WriteLine($"ImageRepository Error: Deserialization failed for ID {id}.");
                    Console.WriteLine($"Raw Firebase response body: {response.Body}");
                    return null;
                }

                return MapToDTO(image);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ImageRepository Error: Exception during GetByIdAsync for ID {id}: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> UpdateAsync(string id, UpdateImageDTO dto)
        {
            var existingResponse = await _firebase.GetAsync(GetPath(id));
            if (existingResponse.Body == "null") return false;

            var existing = existingResponse.ResultAs<Image>();

            if (existing == null) return false;

            // Cập nhật các trường
            if (dto.Title != null) existing.Title = dto.Title;
            if (dto.Description != null) existing.Description = dto.Description;
            if (dto.IsPublic.HasValue) existing.IsPublic = dto.IsPublic.Value;
            if (dto.Status != null) existing.Status = dto.Status;
            existing.UpdatedAt = DateTime.UtcNow;

            await _firebase.SetAsync(GetPath(id), existing);

            return true;
        }
    }
}