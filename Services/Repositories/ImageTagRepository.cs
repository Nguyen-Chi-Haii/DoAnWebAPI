using DoAnWebAPI.Model;
using Firebase.Database;
using Firebase.Database.Query;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Repositories
{
    public class ImageTagRepository : IImageTagRepository
    {
        private readonly FirebaseClient _firebase;

        public ImageTagRepository(FirebaseClient firebase)
        {
            _firebase = firebase;
        }

        public async Task<bool> AddAsync(ImageTag imageTag)
        {
            // Kiểm tra xem mối quan hệ đã tồn tại chưa
            var existing = await _firebase
                .Child("imageTags")
                .OnceAsync<ImageTag>();

            if (existing.Any(x =>
                x.Object.ImageId == imageTag.ImageId &&
                x.Object.TagId == imageTag.TagId))
            {
                return false; // Đã tồn tại
            }

            await _firebase
                .Child("imageTags")
                .PostAsync(imageTag);

            return true;
        }

        public async Task<bool> DeleteAsync(int imageId, int tagId)
        {
            var items = await _firebase
                .Child("imageTags")
                .OnceAsync<ImageTag>();

            var toDelete = items.FirstOrDefault(x =>
                x.Object.ImageId == imageId &&
                x.Object.TagId == tagId);

            if (toDelete == null) return false;

            await _firebase
                .Child("imageTags")
                .Child(toDelete.Key)
                .DeleteAsync();

            return true;
        }

        public async Task<List<ImageTag>> GetAllAsync()
        {
            var result = await _firebase
                .Child("imageTags")
                .OnceAsync<ImageTag>();

            return result.Select(x => x.Object).ToList();
        }

        public async Task<List<ImageTag>> GetByImageIdAsync(int imageId)
        {
            var result = await _firebase
                .Child("imageTags")
                .OnceAsync<ImageTag>();

            return result
                .Select(x => x.Object)
                .Where(x => x.ImageId == imageId)
                .ToList();
        }

        public async Task<List<ImageTag>> GetByTagIdAsync(int tagId)
        {
            var result = await _firebase
                .Child("imageTags")
                .OnceAsync<ImageTag>();

            return result
                .Select(x => x.Object)
                .Where(x => x.TagId == tagId)
                .ToList();
        }
    }
}
