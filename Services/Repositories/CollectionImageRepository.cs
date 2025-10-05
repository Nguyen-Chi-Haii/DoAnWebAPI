using DoAnWebAPI.Model;
using DoAnWebAPI.Services.Interface;
using Firebase.Database;
using Firebase.Database.Query;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class CollectionImageRepository : ICollectionImageRepository
    {
        private readonly FirebaseClient _firebase;
        private const string Collection = "collection_images";

        public CollectionImageRepository(FirebaseClient firebase)
        {
            _firebase = firebase;
        }

        public async Task<List<CollectionImage>> GetImagesByCollectionIdAsync(int collectionId)
        {
            var data = await _firebase.Child(Collection)
                .OnceAsync<CollectionImage>();

            return data
                .Where(x => x.Object != null && x.Object.CollectionId == collectionId)
                .Select(x => x.Object)
                .ToList();
        }

        public async Task<List<CollectionImage>> GetCollectionsByImageIdAsync(int imageId)
        {
            var data = await _firebase.Child(Collection)
                .OnceAsync<CollectionImage>();

            return data
                .Where(x => x.Object != null && x.Object.ImageId == imageId)
                .Select(x => x.Object)
                .ToList();
        }

        public async Task<CollectionImage?> AddImageToCollectionAsync(int collectionId, int imageId)
        {
            var key = $"col_{collectionId}_img_{imageId}";

            // Check if already exists
            var existing = await _firebase.Child(Collection).Child(key).OnceSingleAsync<CollectionImage>();
            if (existing != null) return null;

            var newEntry = new CollectionImage
            {
                CollectionId = collectionId,
                ImageId = imageId,
                AddedAt = DateTime.UtcNow
            };

            await _firebase.Child(Collection).Child(key).PutAsync(newEntry);
            return newEntry;
        }

        public async Task<bool> RemoveImageFromCollectionAsync(int collectionId, int imageId)
        {
            var key = $"col_{collectionId}_img_{imageId}";
            var existing = await _firebase.Child(Collection).Child(key).OnceSingleAsync<CollectionImage>();

            if (existing == null) return false;

            await _firebase.Child(Collection).Child(key).DeleteAsync();
            return true;
        }

        public async Task SyncImagesInCollectionAsync(int collectionId, List<int> imageIds)
        {
            var existingLinks = await GetImagesByCollectionIdAsync(collectionId);
            var existingImageIds = existingLinks.Select(l => l.ImageId).ToHashSet();
            var targetImageIds = imageIds.ToHashSet();

            var toRemove = existingImageIds.Except(targetImageIds).ToList();
            var toAdd = targetImageIds.Except(existingImageIds).ToList();

            // Remove existing links not in the new list
            foreach (var imageId in toRemove)
            {
                await RemoveImageFromCollectionAsync(collectionId, imageId);
            }

            // Add new links
            foreach (var imageId in toAdd)
            {
                await AddImageToCollectionAsync(collectionId, imageId);
            }
        }
    }
}