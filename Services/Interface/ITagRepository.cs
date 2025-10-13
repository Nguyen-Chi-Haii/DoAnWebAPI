using DoAnWebAPI.Model.DTO.Tag;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface ITagRepository
    {
        Task<IEnumerable<TagDTO>> GetAllAsync();
        Task<TagDTO?> GetByIdAsync(int id); 
        Task<TagDTO> CreateAsync(CreateTagDTO dto);
        Task<bool> UpdateAsync(int id, UpdateTagDTO dto); 
        Task<bool> DeleteAsync(int id); 
    }
}