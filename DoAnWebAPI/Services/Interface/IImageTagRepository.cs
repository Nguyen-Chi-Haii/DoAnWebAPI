using DoAnWebAPI.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Repositories
{
    public interface IImageTagRepository
    {
        Task<bool> AddAsync(ImageTag imageTag);
        Task<bool> DeleteAsync(int imageId, int tagId);
        Task<List<ImageTag>> GetAllAsync();
        Task<List<ImageTag>> GetByImageIdAsync(int imageId);
        Task<List<ImageTag>> GetByTagIdAsync(int tagId);
    }
}
