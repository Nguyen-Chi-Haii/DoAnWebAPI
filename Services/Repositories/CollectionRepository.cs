using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Collection;
using DoAnWebAPI.Services.Interface;
using Firebase.Database;
using Firebase.Database.Query;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class CollectionRepository : ICollectionRepository
    {
        private readonly FirebaseClient _firebase;
        private readonly ICollectionImageRepository _collectionImageRepository;
        private const string Collection = "collections";

        public CollectionRepository(FirebaseClient firebase, ICollectionImageRepository collectionImageRepository)
        {
            _firebase = firebase;
            _collectionImageRepository = collectionImageRepository;
        }

        private async Task<int> GetNextIdAsync()
        {
            var data = await _firebase.Child(Collection).OnceAsync<Collection>();
            return data.Any() ? data.Max(d => d.Object.Id) + 1 : 1;
        }

        public async Task<List<Collection>> GetAllAsync()
        {
            var data = await _firebase.Child(Collection).OnceAsync<Collection>();
            return data.Select(d => d.Object).ToList();
        }

        public async Task<Collection?> GetByIdAsync(int id)
        {
            return await _firebase.Child(Collection).Child(id.ToString()).OnceSingleAsync<Collection>();
        }

        public async Task<List<Collection>> GetByUserIdAsync(int userId)
        {
            var data = await _firebase.Child(Collection).OnceAsync<Collection>();
            return data.Where(d => d.Object != null && d.Object.UserId == userId).Select(d => d.Object).ToList();
        }

        public async Task<Collection> CreateAsync(CreateCollectionDTO dto)
        {
            var nextId = await GetNextIdAsync();
            var collection = new Collection
            {
                Id = nextId,
                UserId = dto.UserId,
                Name = dto.Name,
                Description = dto.Description,
                IsPublic = dto.IsPublic,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _firebase.Child(Collection).Child(nextId.ToString()).PutAsync(collection);

            // Add images if provided
            if (dto.ImageIds != null && dto.ImageIds.Any())
            {
                await _collectionImageRepository.SyncImagesInCollectionAsync(nextId, dto.ImageIds);
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

            await _firebase.Child(Collection).Child(id.ToString()).PutAsync(existing);

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

            // Delete collection
            await _firebase.Child(Collection).Child(id.ToString()).DeleteAsync();

            // NOTE: Ideally, clean up associated collection_images entries.

            return true;
        }
    }
}