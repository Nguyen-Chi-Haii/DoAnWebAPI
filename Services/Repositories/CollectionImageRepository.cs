using DoAnWebAPI.Model;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System; // Cần thiết cho DateTime

namespace DoAnWebAPI.Services.Repositories
{
    public class CollectionImageRepository : ICollectionImageRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private const string Collection = "collection_images";

        public CollectionImageRepository(FireSharp.FirebaseClient firebase) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
        }

        private string GetPath(int collectionId, int imageId) => $"{Collection}/col_{collectionId}_img_{imageId}";
        private string GetCollectionPath() => Collection;

        public async Task<List<CollectionImage>> GetImagesByCollectionIdAsync(int collectionId)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(GetCollectionPath());

            if (response.Body == "null") return new List<CollectionImage>();

            var data = response.ResultAs<Dictionary<string, CollectionImage>>();

            return data?.Values
                .Where(x => x != null && x.CollectionId == collectionId)
                .ToList() ?? new List<CollectionImage>();
        }

        public async Task<List<CollectionImage>> GetCollectionsByImageIdAsync(int imageId)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(GetCollectionPath());

            if (response.Body == "null") return new List<CollectionImage>();

            var data = response.ResultAs<Dictionary<string, CollectionImage>>();

            return data?.Values
                .Where(x => x != null && x.ImageId == imageId)
                .ToList() ?? new List<CollectionImage>();
        }

        public async Task<CollectionImage?> AddImageToCollectionAsync(int collectionId, int imageId)
        {
            var key = $"col_{collectionId}_img_{imageId}";
            var path = GetPath(collectionId, imageId);

            // ✅ FIX: Kiểm tra sự tồn tại bằng FireSharp GetAsync
            var existingResponse = await _firebase.GetAsync(path);
            if (existingResponse.Body != "null") return null;

            var newEntry = new CollectionImage
            {
                CollectionId = collectionId,
                ImageId = imageId,
                AddedAt = DateTime.UtcNow
            };

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(path, newEntry);
            return newEntry;
        }

        public async Task<bool> RemoveImageFromCollectionAsync(int collectionId, int imageId)
        {
            var path = GetPath(collectionId, imageId);

            // ✅ FIX: Kiểm tra sự tồn tại bằng FireSharp GetAsync
            var existingResponse = await _firebase.GetAsync(path);

            if (existingResponse.Body == "null") return false;

            // ✅ FIX: Sử dụng FireSharp DeleteAsync
            await _firebase.DeleteAsync(path);
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