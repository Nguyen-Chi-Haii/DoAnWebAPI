using DoAnWebAPI.Model;

namespace DoAnWebAPI.Services.Interface
{
    public interface IImageTopicRepository
    {
        Task<List<ImageTopic>> GetTopicsByImageIdAsync(int imageId);
        Task<ImageTopic?> AddTopicToImageAsync(int imageId, int topicId);
        Task<bool> RemoveTopicFromImageAsync(int imageId, int topicId);
    }
}
