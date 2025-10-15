using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Stats;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface IStatRepository
    {
        Task<Stat?> GetStatByImageIdAsync(int imageId);
        Task<Stat> CreateStatAsync(int imageId);
        Task<Stat> IncrementViewsAsync(int imageId);
        Task<Stat> IncrementDownloadsAsync(int imageId);
        Task<Stat> IncrementLikesAsync(int imageId);
        Task<Stat> DecrementLikesAsync(int imageId); 
        Task<StatDTO?> GetStatDTOByImageIdAsync(int imageId);
        Task<IEnumerable<Stat>> GetAllAsync();
    }
}