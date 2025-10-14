using DoAnWebAPI.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface ICollectionImageRepository
    {
        Task<List<CollectionImage>> GetImagesByCollectionIdAsync(int collectionId);
        Task<List<CollectionImage>> GetCollectionsByImageIdAsync(int imageId);
        Task<CollectionImage?> AddImageToCollectionAsync(int collectionId, int imageId);
        Task<bool> RemoveImageFromCollectionAsync(int collectionId, int imageId);
        Task SyncImagesInCollectionAsync(int collectionId, List<int> imageIds);
    }
}