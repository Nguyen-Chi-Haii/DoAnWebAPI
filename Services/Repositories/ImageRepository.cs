using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using FirebaseWebApi.Models; // Assumed namespace for Image model
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace DoAnWebAPI.Services.Repositories
{
    public class ImageRepository : IImageRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private readonly ICloudinaryService _cloudinaryService;
        private const string Collection = "images";

        public ImageRepository(FireSharp.FirebaseClient firebase, ICloudinaryService cloudinaryService) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
            _cloudinaryService = cloudinaryService;
        }

        private string GetPath(string id) => $"{Collection}/{id}";
        private string GetCollectionPath() => Collection;

        // Logic CreateAsync
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

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(image.Id.ToString()), image);

            // TODO: (Đề xuất) Thêm logic lưu TagIds và TopicIds vào các bảng liên kết ở đây

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

        public async Task<bool> DeleteAsync(string id)
        {
            // ✅ FIX: Kiểm tra sự tồn tại bằng FireSharp GetAsync
            var checkResponse = await _firebase.GetAsync(GetPath(id));
            if (checkResponse.Body == "null") return false;

            // ✅ FIX: Sử dụng FireSharp DeleteAsync
            await _firebase.DeleteAsync(GetPath(id));
            return true;
        }

        public async Task<IEnumerable<ImageDTO>> GetAllAsync()
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync để đọc toàn bộ collection
            var response = await _firebase.GetAsync(GetCollectionPath());

            if (response.Body == "null") return new List<ImageDTO>();

            var data = response.ResultAs<Dictionary<string, Image>>();

            return data?.Values.Select(d => new ImageDTO
            {
                Id = d.Id,
                UserId = d.UserId,
                Title = d.Title,
                FileUrl = d.FileUrl,
                ThumbnailUrl = d.ThumbnailUrl,
                IsPublic = d.IsPublic,
                Status = d.Status,
                Tags = new List<TagDTO>(),
                Topics = new List<TopicDTO>()
            }).ToList() ?? new List<ImageDTO>();
        }

        public async Task<ImageDTO> GetByIdAsync(string id)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(GetPath(id));

            if (response.Body == "null") return null;

            var image = response.ResultAs<Image>();

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

        public async Task<bool> UpdateAsync(string id, UpdateImageDTO dto)
        {
            var existingResponse = await _firebase.GetAsync(GetPath(id));
            if (existingResponse.Body == "null") return false;

            var existing = existingResponse.ResultAs<Image>();

            // Cập nhật các trường
            if (dto.Title != null) existing.Title = dto.Title;
            if (dto.Description != null) existing.Description = dto.Description;
            if (dto.IsPublic.HasValue) existing.IsPublic = dto.IsPublic.Value;
            if (dto.Status != null) existing.Status = dto.Status;
            existing.UpdatedAt = DateTime.UtcNow;

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(id), existing);

            // TODO: (Đề xuất) Thêm logic sync TagIds và TopicIds

            return true;
        }
    }
}