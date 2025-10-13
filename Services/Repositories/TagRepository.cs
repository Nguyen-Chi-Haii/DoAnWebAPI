using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
// Giả định Tag model nằm trong DoAnWebAPI.Model.Domain hoặc tương đương

namespace DoAnWebAPI.Services.Repositories
{
    public class TagRepository : ITagRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private const string Collection = "tags";

        public TagRepository(FireSharp.FirebaseClient firebase) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
        }

        private string GetPath(int id) => $"{Collection}/{id}";
        private string GetCollectionPath() => Collection;

        public async Task<IEnumerable<TagDTO>> GetAllAsync()
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(GetCollectionPath());

            if (response.Body == "null") return new List<TagDTO>();

            var data = response.ResultAs<Dictionary<string, Model.Tag>>();

            return data?.Values.Select(d => new TagDTO
            {
                Id = d.Id,
                Name = d.Name,
                Images = new List<ImageDTO>()
            }).ToList() ?? new List<TagDTO>();
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
                Name = dto.Name
            };

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(tag.Id), tag);

            return new TagDTO
            {
                Id = tag.Id,
                Name = tag.Name,
                Images = new List<ImageDTO>()
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