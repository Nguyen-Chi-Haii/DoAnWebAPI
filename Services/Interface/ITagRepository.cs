using DoAnWebAPI.Model.DTO.Tag;

namespace DoAnWebAPI.Services.Interface
{
    public interface ITagRepository
    {
        Task<IEnumerable<TagDTO>> GetAllAsync();
        Task<TagDTO?> GetByIdAsync(string id);
        Task<TagDTO> CreateAsync(CreateTagDTO dto);
        Task<bool> UpdateAsync(string id, UpdateTagDTO dto);
        Task<bool> DeleteAsync(string id);
    }
}
