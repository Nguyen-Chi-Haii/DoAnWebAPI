using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Stats;
using DoAnWebAPI.Services.Interface;
using FireSharp; // ✅ THÊM using FireSharp
using FireSharp.Response; // ✅ THÊM using FireSharp.Response
using System.Linq;
using System.Threading.Tasks;
using System;

namespace DoAnWebAPI.Services.Repositories
{
    public class StatRepository : IStatRepository
    {
        private readonly FireSharp.FirebaseClient _firebase; // ✅ FIX: Dùng FireSharp.FirebaseClient
        private const string Collection = "stats";

        public StatRepository(FireSharp.FirebaseClient firebase) // ✅ FIX: Dùng FireSharp.FirebaseClient
        {
            _firebase = firebase;
        }

        private string GetPath(int imageId) => $"{Collection}/{imageId}";

        private async Task<Stat?> GetStatDomainByImageIdAsync(int imageId)
        {
            var path = GetPath(imageId);
            // ✅ FIX: Sử dụng FireSharp GetAsync
            var response = await _firebase.GetAsync(path);

            if (response.Body == "null") return null;
            return response.ResultAs<Stat>();
        }

        public async Task<Stat> CreateStatAsync(int imageId)
        {
            var stat = new Stat
            {
                Id = imageId,
                ImageId = imageId,
                ViewsCount = 0,
                DownloadCount = 0,
                LikesCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(imageId), stat);
            return stat;
        }

        private async Task<Stat> GetOrCreateStatAsync(int imageId)
        {
            var existing = await GetStatDomainByImageIdAsync(imageId);
            if (existing != null) return existing;
            return await CreateStatAsync(imageId);
        }

        public async Task<Stat?> GetStatByImageIdAsync(int imageId)
        {
            return await GetStatDomainByImageIdAsync(imageId);
        }

        public async Task<StatDTO?> GetStatDTOByImageIdAsync(int imageId)
        {
            var stat = await GetStatDomainByImageIdAsync(imageId);
            if (stat == null) return null;

            return new StatDTO
            {
                Id = stat.Id,
                ImageId = stat.ImageId,
                ViewsCount = stat.ViewsCount,
                DownloadCount = stat.DownloadCount,
                LikesCount = stat.LikesCount
            };
        }

        // Helper method cho logic update lặp lại
        private async Task<Stat> UpdateStatField(int imageId, Action<Stat> updateAction)
        {
            var stat = await GetOrCreateStatAsync(imageId);
            updateAction(stat);
            stat.UpdatedAt = DateTime.UtcNow;

            // ✅ FIX: Sử dụng FireSharp SetAsync
            await _firebase.SetAsync(GetPath(imageId), stat);
            return stat;
        }


        public Task<Stat> IncrementViewsAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => stat.ViewsCount++);
        }

        public Task<Stat> IncrementDownloadsAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => stat.DownloadCount++);
        }

        public Task<Stat> IncrementLikesAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => stat.LikesCount++);
        }

        public Task<Stat> DecrementLikesAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => {
                if (stat.LikesCount > 0)
                {
                    stat.LikesCount--;
                }
            });
        }
    }
}