using DoAnWebAPI.Model.DTO.Tag;

namespace DoAnWebAPI.Services.Interface
{
    public interface ITagRepository
    {
        Task<IEnumerable<TagDTO>> GetAllAsync();
        Task<TagDTO> GetByIdAsync(int tagId);
        Task<TagDTO> CreateAsync(CreateTagDTO dto);
        Task<bool> UpdateAsync(int id, UpdateTagDTO dto); 
        Task<bool> DeleteAsync(int id); 
    }
}
