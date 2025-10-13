using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Like;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System; // Cần thiết cho DateTime

namespace DoAnWebAPI.Services.Repositories
{
    public class LikeRepository : ILikeRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private const string Collection = "likes";

        public LikeRepository(FireSharp.FirebaseClient firebase) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
        }

        // Helper để tạo key và path
        private string GetKey(int imageId, int userId) => $"like_{imageId}_user_{userId}";
        private string GetPath(int imageId, int userId) => $"{Collection}/{GetKey(imageId, userId)}";
        private string GetCollectionPath() => Collection;

        public async Task<Like> CreateLikeAsync(int userId, int imageId)
        {
            var like = new Like
            {
                Id = 0, // Placeholder
                UserId = userId,
                ImageId = imageId,
                CreatedAt = DateTime.UtcNow
            };

            var path = GetPath(imageId, userId);
            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(path, like);

            return like;
        }

        public async Task<bool> DeleteLikeAsync(int imageId, int userId)
        {
            var path = GetPath(imageId, userId);

            // ✅ FIX: Kiểm tra sự tồn tại bằng FireSharp GetAsync
            var checkResponse = await _firebase.GetAsync(path);
            if (checkResponse.Body == "null") return false;

            // ✅ FIX: Sử dụng FireSharp DeleteAsync
            await _firebase.DeleteAsync(path);
            return true;
        }

        public async Task<Like?> GetLikeByImageAndUserAsync(int imageId, int userId)
        {
            var path = GetPath(imageId, userId);
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(path);

            if (response.Body == "null") return null;
            return response.ResultAs<Like>();
        }

        public async Task<List<Like>> GetLikesByImageIdAsync(int imageId)
        {
            // ✅ FIX: Sử dụng FireSharp GetAsync để đọc toàn bộ node
            var response = await _firebase.GetAsync(GetCollectionPath());

            if (response.Body == "null")
                return new List<Like>();

            var likesDict = response.ResultAs<Dictionary<string, Like>>();

            if (likesDict == null)
                return new List<Like>();

            return likesDict.Values
                .Where(x => x != null && x.ImageId == imageId)
                .ToList();
        }
    }
}