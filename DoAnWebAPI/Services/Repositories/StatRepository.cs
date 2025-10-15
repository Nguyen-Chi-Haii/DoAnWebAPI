// File: Services/Repositories/StatRepository.cs

using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Stats;
using DoAnWebAPI.Services.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class StatRepository : IStatRepository
    {
        private readonly FireSharp.FirebaseClient _firebase;
        private const string Collection = "stats";

        public StatRepository(FireSharp.FirebaseClient firebase)
        {
            _firebase = firebase;
        }

        private string GetPath(int imageId) => $"{Collection}/{imageId}";

        // Private helper, không cần thay đổi
        private async Task<Stat?> GetStatDomainByImageIdAsync(int imageId)
        {
            var path = GetPath(imageId);
            var response = await _firebase.GetAsync(path);
            if (response.Body == "null") return null;
            return response.ResultAs<Stat>();
        }

        public async Task<Stat> CreateStatAsync(int imageId)
        {
            var stat = new Stat
            {
                Id = imageId, // Khớp với model Stat.cs
                ImageId = imageId,
                ViewsCount = 0,    // Khớp với model Stat.cs
                DownloadCount = 0, // Khớp với model Stat.cs
                LikesCount = 0,    // Khớp với model Stat.cs
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _firebase.SetAsync(GetPath(imageId), stat);
            return stat;
        }

        // Private helper, không cần thay đổi
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
                ViewsCount = stat.ViewsCount,       // Khớp với model Stat.cs
                DownloadCount = stat.DownloadCount, // Khớp với model Stat.cs
                LikesCount = stat.LikesCount        // Khớp với model Stat.cs
            };
        }

        // Private helper, không cần thay đổi
        private async Task<Stat> UpdateStatField(int imageId, Action<Stat> updateAction)
        {
            var stat = await GetOrCreateStatAsync(imageId);
            updateAction(stat);
            stat.UpdatedAt = DateTime.UtcNow;

            await _firebase.SetAsync(GetPath(imageId), stat);
            return stat;
        }

        public Task<Stat> IncrementViewsAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => stat.ViewsCount++); // Khớp với model Stat.cs
        }

        public Task<Stat> IncrementDownloadsAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => stat.DownloadCount++); // Khớp với model Stat.cs
        }

        public Task<Stat> IncrementLikesAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => stat.LikesCount++); // Khớp với model Stat.cs
        }

        public Task<Stat> DecrementLikesAsync(int imageId)
        {
            return UpdateStatField(imageId, stat => {
                if (stat.LikesCount > 0) // Khớp với model Stat.cs
                {
                    stat.LikesCount--; // Khớp với model Stat.cs
                }
            });
        }

        public async Task<IEnumerable<Stat>> GetAllAsync()
        {
            var response = await _firebase.GetAsync(Collection);
            if (response.Body == "null")
                return new List<Stat>();

            var statsDict = response.ResultAs<Dictionary<string, Stat>>();

            if (statsDict == null)
            {
                return new List<Stat>();
            }

            return statsDict.Values;
        }
    }
}