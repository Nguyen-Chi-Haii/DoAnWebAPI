using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Topics;

namespace DoAnWebAPI.Services.Interface
{
    public interface ITopicRepository
    {
        Task<List<Topic>> GetAllAsync();
        Task<Topic?> GetByIdAsync(int id);
        Task<Topic> CreateAsync(CreateTopicDTO createDto);
        Task<Topic?> UpdateAsync(int id, UpdateTopicDTO updateDto);
        Task<bool> DeleteAsync(int id);
    }
}
