using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Model;
using DoAnWebAPI.Services.Interface;

namespace DoAnWebAPI.Services.Repositories
{
    public class TopicRepository : ITopicRepository
    {
        private readonly FirebaseService _firebaseService;
        private const string Collection = "topics";

        public TopicRepository(FirebaseService firebaseService)
        {
            _firebaseService = firebaseService;
        }

        public async Task<List<Topic>> GetAllAsync()
        {
            try
            {
                var dict = await _firebaseService.GetDataAsync<Dictionary<string, Topic>>(Collection);
                var topics = dict?.Values.ToList() ?? new List<Topic>();
                return topics;
            }
            catch (Exception ex)
            {
                // Log exception
                return new List<Topic>();
            }
        }

        public async Task<Topic?> GetByIdAsync(int id)
        {
            return await _firebaseService.GetDataAsync<Topic>($"{Collection}/topic_{id}");
        }

        public async Task<Topic> CreateAsync(CreateTopicDTO createDto)
        {
            var nextId = await GetNextIdAsync();
            var topic = new Topic
            {
                Id = nextId,
                Name = createDto.Name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var key = $"topic_{nextId}";
            await _firebaseService.SetDataAsync($"{Collection}/{key}", topic);
            return topic;
        }

        public async Task<Topic?> UpdateAsync(int id, UpdateTopicDTO updateDto)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = updateDto.Name;
            existing.UpdatedAt = DateTime.UtcNow;

            var key = $"topic_{id}";
            await _firebaseService.SetDataAsync($"{Collection}/{key}", existing);
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null) return false;

            var key = $"topic_{id}";
            await _firebaseService.DeleteDataAsync($"{Collection}/{key}");
            return true;
        }

        private async Task<int> GetNextIdAsync()
        {
            var topics = await GetAllAsync();
            return topics.Any() ? topics.Max(t => t.Id) + 1 : 1;
        }
    }
}
