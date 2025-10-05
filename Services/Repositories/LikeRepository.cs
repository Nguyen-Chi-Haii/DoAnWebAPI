using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Like;
using DoAnWebAPI.Services.Interface;
using Firebase.Database;
using Firebase.Database.Query;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class LikeRepository : ILikeRepository
    {
        private readonly FirebaseClient _firebase;
        private const string Collection = "likes";

        public LikeRepository(FirebaseClient firebase)
        {
            _firebase = firebase;
        }

        // Use a composite key for Firebase RTDB
        private string GetKey(int imageId, int userId) => $"like_{imageId}_user_{userId}";

        public async Task<Like> CreateLikeAsync(CreateLikeDTO dto)
        {
            var like = new Like
            {
                Id = 0, // Placeholder
                UserId = dto.UserId,
                ImageId = dto.ImageId,
                CreatedAt = DateTime.UtcNow
            };

            var key = GetKey(dto.ImageId, dto.UserId);
            await _firebase.Child(Collection).Child(key).PutAsync(like);

            return like;
        }

        public async Task<bool> DeleteLikeAsync(int imageId, int userId)
        {
            var key = GetKey(imageId, userId);
            var existing = await _firebase.Child(Collection).Child(key).OnceSingleAsync<Like>();

            if (existing == null) return false;

            await _firebase.Child(Collection).Child(key).DeleteAsync();
            return true;
        }

        public async Task<Like?> GetLikeByImageAndUserAsync(int imageId, int userId)
        {
            var key = GetKey(imageId, userId);
            return await _firebase.Child(Collection).Child(key).OnceSingleAsync<Like>();
        }

        public async Task<List<Like>> GetLikesByImageIdAsync(int imageId)
        {
            var data = await _firebase.Child(Collection)
               .OnceAsync<Like>();

            return data
                .Where(x => x.Object != null && x.Object.ImageId == imageId)
                .Select(x => x.Object)
                .ToList();
        }
    }
}