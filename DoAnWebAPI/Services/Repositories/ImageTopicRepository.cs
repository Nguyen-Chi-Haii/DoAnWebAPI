using DoAnWebAPI.Model;
using DoAnWebAPI.Services.Interface;

namespace DoAnWebAPI.Services.Repositories
{
    public class ImageTopicRepository : IImageTopicRepository
    {
        private readonly FirebaseService _firebaseService;
        private const string Collection = "image_topics";
        public ImageTopicRepository(FirebaseService firebaseService)
        {
            _firebaseService = firebaseService;
        }
        public async Task<List<ImageTopic>> GetAllAsync()
        {
            try
            {
                var dict = await _firebaseService.GetDataAsync<Dictionary<string, ImageTopic>>(Collection);
                if (dict == null) return new List<ImageTopic>();
                return dict.Values.ToList();
            }
            catch (Exception ex)
            {
                // Log và return empty
                return new List<ImageTopic>();
            }
        }
        public async Task<List<ImageTopic>> GetTopicsByImageIdAsync(int imageId)
        {
            try
            {
                var dict = await _firebaseService.GetDataAsync<Dictionary<string, ImageTopic>>(Collection);
                if (dict == null) return new List<ImageTopic>();
                return dict.Values.Where(it => it.ImageId == imageId).ToList();
            }
            catch (Exception ex)
            {
                // Log và return empty hoặc throw custom
                return new List<ImageTopic>(); // Hoặc throw nếu critical
            }
        }
        public async Task<ImageTopic?> AddTopicToImageAsync(int imageId, int topicId)
        {
            try
            {
                var key = $"img_{imageId}top{topicId}";
                var existing = await _firebaseService.GetDataAsync<ImageTopic>($"{Collection}/{key}");
                if (existing != null)
                {
                    return null; // Already exists
                }
                var newEntry = new ImageTopic
                {
                    ImageId = imageId,
                    TopicId = topicId,
                    CreatedAt = DateTime.UtcNow
                };
                await _firebaseService.SetDataAsync($"{Collection}/{key}", newEntry);
                return newEntry;
            }
            catch (Exception ex)
            {
                // Log error
                return null;
            }
        }
        public async Task<bool> RemoveTopicFromImageAsync(int imageId, int topicId)
        {
            try
            {
                var key = $"img_{imageId}top{topicId}";
                var existing = await _firebaseService.GetDataAsync<ImageTopic>($"{Collection}/{key}");
                if (existing == null)
                {
                    return false; // Not found
                }
                await _firebaseService.DeleteDataAsync($"{Collection}/{key}");
                return true;
            }
            catch (Exception ex)
            {
                // Log error
                return false;
            }
        }
    }
}
