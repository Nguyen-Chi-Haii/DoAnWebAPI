using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Collection;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface ICollectionRepository
    {
        Task<List<Collection>> GetAllAsync();
        Task<Collection?> GetByIdAsync(int id);
        Task<Collection> CreateAsync(CreateCollectionDTO dto);
        Task<Collection?> UpdateAsync(int id, UpdateCollectionDTO dto);
        Task<bool> DeleteAsync(int id);
        Task<List<Collection>> GetByUserIdAsync(int userId);
    }
}