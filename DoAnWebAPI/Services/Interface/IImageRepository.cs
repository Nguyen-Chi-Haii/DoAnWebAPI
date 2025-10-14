using DoAnWebAPI.Model.DTO.Image;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface IImageRepository
    {
        Task<IEnumerable<ImageDTO>> GetAllAsync();
        Task<ImageDTO> GetByIdAsync(string id);
        // ✅ Chữ ký mới: Nhận UserId an toàn và các trường dữ liệu cần thiết
        Task<ImageDTO> CreateAsync(
            int userId,
            string title,
            string? description,
            bool isPublic,
            List<int> tagIds,
            List<int> topicIds,
            string fileUrl,
            string thumbnailUrl,
            long size,
            int width,
            int height
        );
        Task<bool> UpdateAsync(string id, UpdateImageDTO dto);
        Task<bool> DeleteAsync(string id);
    }
}