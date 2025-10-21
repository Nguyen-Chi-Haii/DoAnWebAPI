using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
// Giả định Tag model nằm trong DoAnWebAPI.Model.Domain hoặc tương đương

namespace DoAnWebAPI.Services.Repositories
{
    public class TagRepository : ITagRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private const string Collection = "tags";
        private readonly IImageTagRepository _imageTagRepository;

        public TagRepository(FireSharp.FirebaseClient firebase, IImageTagRepository imageTagRepository) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
            _imageTagRepository = imageTagRepository;
        }

        private string GetPath(int id) => $"{Collection}/{id}";
        private string GetCollectionPath() => Collection;

        public async Task<IEnumerable<TagDTO>> GetAllAsync()
        {
            // 1. Lấy tất cả tags (như cũ)
            var response = await _firebase.GetAsync(GetCollectionPath());
            if (response.Body == "null") return new List<TagDTO>();
            var data = response.ResultAs<Dictionary<string, Model.Tag>>();
            if (data == null) return new List<TagDTO>();

            // 2. Lấy tất cả liên kết image-tag (1 lần gọi duy nhất)
            var allImageTags = await _imageTagRepository.GetAllAsync();

            // 3. Đếm và nhóm chúng vào một Dictionary để tra cứu nhanh
            var tagCounts = allImageTags
                .GroupBy(it => it.TagId)
                .ToDictionary(g => g.Key, g => g.Count());

            // 4. Map sang DTO, thêm 2 trường mới
            return data.Values.Select(d => new TagDTO
            {
                Id = d.Id,
                Name = d.Name,
                // Giả định Model.Tag của bạn có 'CreatedAt' kiểu string
                CreatedAt = d.CreatedAt != null ? d.CreatedAt : (DateTime?)null,
                ImageCount = tagCounts.GetValueOrDefault(d.Id, 0)
                // 'Images' không cần thiết cho trang này
            }).ToList();
        }

        public async Task<TagDTO?> GetByIdAsync(int id)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(GetPath(id));

            if (response.Body == "null") return null;

            var tag = response.ResultAs<Model.Tag>();

            return new TagDTO
            {
                Id = tag.Id,
                Name = tag.Name,
                Images = new List<ImageDTO>()
            };
        }

        public async Task<TagDTO> CreateAsync(CreateTagDTO dto)
        {
            var tag = new Model.Tag
            {
                Id = new Random().Next(1, 999999),
                Name = dto.Name,
                CreatedAt = DateTime.UtcNow // THÊM DÒNG NÀY
            };

            await _firebase.SetAsync(GetPath(tag.Id), tag);
            return new TagDTO
            {
                Id = tag.Id,
                Name = tag.Name,
                CreatedAt = tag.CreatedAt, // Trả về ngày tạo
                ImageCount = 0
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateTagDTO dto)
        {
            var existingResponse = await _firebase.GetAsync(GetPath(id));
            if (existingResponse.Body == "null") return false;

            var existing = existingResponse.ResultAs<Model.Tag>();

            existing.Name = dto.Name;

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(id), existing);

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existingResponse = await _firebase.GetAsync(GetPath(id));
            if (existingResponse.Body == "null") return false;

            // ✅ FIX: Sử dụng FireSharp DeleteAsync
            await _firebase.DeleteAsync(GetPath(id));

            return true;
        }
    }
}