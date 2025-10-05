using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Stats;
using DoAnWebAPI.Services.Interface;
using Firebase.Database;
using Firebase.Database.Query;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class StatRepository : IStatRepository
    {
        private readonly FirebaseClient _firebase;
        private const string Collection = "stats";

        public StatRepository(FirebaseClient firebase)
        {
            _firebase = firebase;
        }

        // Stats are keyed by ImageId in Firebase
        public async Task<Stat> CreateStatAsync(int imageId)
        {
            var stat = new Stat
            {
                Id = imageId, // Use ImageId as a key for quick lookup
                ImageId = imageId,
                ViewsCount = 0,
                DownloadCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _firebase.Child(Collection).Child(imageId.ToString()).PutAsync(stat);
            return stat;
        }

        private async Task<Stat> GetOrCreateStatAsync(int imageId)
        {
            var existing = await GetStatByImageIdAsync(imageId);
            if (existing != null) return existing;
            return await CreateStatAsync(imageId);
        }

        public async Task<Stat?> GetStatByImageIdAsync(int imageId)
        {
            return await _firebase.Child(Collection).Child(imageId.ToString()).OnceSingleAsync<Stat>();
        }

        public async Task<StatDTO?> GetStatDTOByImageIdAsync(int imageId)
        {
            var stat = await GetStatByImageIdAsync(imageId);
            if (stat == null) return null;

            return new StatDTO
            {
                Id = stat.Id,
                ImageId = stat.ImageId,
                ViewsCount = stat.ViewsCount,
                DownloadCount = stat.DownloadCount
            };
        }

        public async Task<Stat> IncrementViewsAsync(int imageId)
        {
            var stat = await GetOrCreateStatAsync(imageId);
            stat.ViewsCount++;
            stat.UpdatedAt = DateTime.UtcNow;
            await _firebase.Child(Collection).Child(imageId.ToString()).PutAsync(stat);
            return stat;
        }

        public async Task<Stat> IncrementDownloadsAsync(int imageId)
        {
            var stat = await GetOrCreateStatAsync(imageId);
            stat.DownloadCount++;
            stat.UpdatedAt = DateTime.UtcNow;
            await _firebase.Child(Collection).Child(imageId.ToString()).PutAsync(stat);
            return stat;
        }
    }
}