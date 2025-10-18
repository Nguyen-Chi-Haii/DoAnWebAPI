using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Collection;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System; // Cần thiết cho DateTime

namespace DoAnWebAPI.Services.Repositories
{
    public class CollectionRepository : ICollectionRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private readonly ICollectionImageRepository _collectionImageRepository;
        private const string Collection = "collections";

        public CollectionRepository(FireSharp.FirebaseClient firebase, ICollectionImageRepository collectionImageRepository) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
            _collectionImageRepository = collectionImageRepository;
        }

        // Helper để lấy path
        private string GetPath(int id) => $"{Collection}/{id}";
        private string GetCollectionPath() => Collection;

        private async Task<int> GetNextIdAsync()
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync để đọc toàn bộ collection
            var response = await _firebase.GetAsync(GetCollectionPath());
            if (response.Body == "null") return 1;

            var data = response.ResultAs<Dictionary<string, Model.Collection>>();
            if (data == null || data.Count == 0) return 1;

            return data.Values.Max(d => d.Id) + 1;
        }

        public async Task<List<Collection>> GetAllAsync()
        {
            var response = await _firebase.GetAsync(GetCollectionPath());
            if (response.Body == "null") return new List<Collection>();

            var data = response.ResultAs<Dictionary<string, Collection>>();
            return data?.Values.ToList() ?? new List<Collection>();
        }

        public async Task<Collection?> GetByIdAsync(int id)
        {
            var response = await _firebase.GetAsync(GetPath(id));
            if (response.Body == "null") return null;

            return response.ResultAs<Collection>();
        }

        public async Task<List<Collection>> GetByUserIdAsync(int userId)
        {
            var response = await _firebase.GetAsync(GetCollectionPath());
            if (response.Body == "null") return new List<Collection>();

            var data = response.ResultAs<Dictionary<string, Collection>>();
            return data?.Values
                .Where(d => d.UserId == userId)
                .ToList() ?? new List<Collection>();
        }


        public async Task<Collection> CreateAsync(Collection collection, List<int> imageIds)
        {
            var nextId = await GetNextIdAsync();

            collection.Id = nextId;
            collection.CreatedAt = DateTime.UtcNow;
            collection.UpdatedAt = DateTime.UtcNow;

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(nextId), collection);

            // Add images if provided
            if (imageIds != null && imageIds.Any())
            {
                await _collectionImageRepository.SyncImagesInCollectionAsync(nextId, imageIds);
            }

            return collection;
        }

        public async Task<Collection?> UpdateAsync(int id, UpdateCollectionDTO dto)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null) return null;

            if (dto.Name != null) existing.Name = dto.Name;
            if (dto.Description != null) existing.Description = dto.Description;
            if (dto.IsPublic.HasValue) existing.IsPublic = dto.IsPublic.Value;
            existing.UpdatedAt = DateTime.UtcNow;

            // ✅ FIX: Sử dụng FireSharp SetAsync (hoặc UpdateAsync nếu có)
            await _firebase.SetAsync(GetPath(id), existing);

            // Sync images
            if (dto.ImageIds != null)
            {
                await _collectionImageRepository.SyncImagesInCollectionAsync(id, dto.ImageIds);
            }

            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null) return false;

            // ✅ FIX: Sử dụng FireSharp DeleteAsync
            await _firebase.DeleteAsync(GetPath(id));

            // NOTE: Ideally, clean up associated collection_images entries.

            return true;
        }
    }
}