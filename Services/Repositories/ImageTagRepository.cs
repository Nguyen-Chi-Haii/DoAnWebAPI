using DoAnWebAPI.Model;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Repositories
{
    // Cần phải đổi namespace nếu file này không nằm trong Services.Repositories
    public class ImageTagRepository : IImageTagRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private const string Collection = "imageTags";

        public ImageTagRepository(FireSharp.FirebaseClient firebase) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
        }

        private string GetCollectionPath() => Collection;
        private string GetKey(int imageId, int tagId) => $"img_{imageId}_tag_{tagId}";

        public async Task<bool> AddAsync(ImageTag imageTag)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync để đọc toàn bộ collection
            var response = await _firebase.GetAsync(GetCollectionPath());

            // Tìm trong bộ nhớ (inefficient nhưng khớp với logic cũ)
            var existingDict = response.ResultAs<Dictionary<string, ImageTag>>();
            if (existingDict != null && existingDict.Values.Any(x =>
                x.ImageId == imageTag.ImageId &&
                x.TagId == imageTag.TagId))
            {
                return false; // Đã tồn tại
            }

            // ✅ FIX: Sử dụng FireSharp PushAsync (tạo key ngẫu nhiên)
            await _firebase.PushAsync(GetCollectionPath(), imageTag);

            return true;
        }

        public async Task<bool> DeleteAsync(int imageId, int tagId)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(GetCollectionPath());
            if (response.Body == "null") return false;

            var items = response.ResultAs<Dictionary<string, ImageTag>>();

            // Tìm key và object cần xóa
            var toDelete = items.FirstOrDefault(x =>
                x.Value.ImageId == imageId &&
                x.Value.TagId == tagId);

            if (toDelete.Key == null) return false;

            // ✅ FIX: Sử dụng FireSharp DeleteAsync
            await _firebase.DeleteAsync($"{GetCollectionPath()}/{toDelete.Key}");

            return true;
        }

        public async Task<List<ImageTag>> GetAllAsync()
        {
            var response = await _firebase.GetAsync(GetCollectionPath());
            if (response.Body == "null") return new List<ImageTag>();

            return response.ResultAs<Dictionary<string, ImageTag>>()?.Values.ToList() ?? new List<ImageTag>();
        }

        public async Task<List<ImageTag>> GetByImageIdAsync(int imageId)
        {
            var all = await GetAllAsync();
            return all.Where(x => x.ImageId == imageId).ToList();
        }

        public async Task<List<ImageTag>> GetByTagIdAsync(int tagId)
        {
            var all = await GetAllAsync();
            return all.Where(x => x.TagId == tagId).ToList();
        }
    }
}