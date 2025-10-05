using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Like;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface ILikeRepository
    {
        Task<List<Like>> GetLikesByImageIdAsync(int imageId);
        Task<Like?> GetLikeByImageAndUserAsync(int imageId, int userId);
        Task<Like> CreateLikeAsync(CreateLikeDTO dto);
        Task<bool> DeleteLikeAsync(int imageId, int userId);
    }
}