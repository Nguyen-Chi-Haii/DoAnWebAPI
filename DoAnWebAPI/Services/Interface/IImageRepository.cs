// File: Services/Interface/IImageRepository.cs

using DoAnWebAPI.Model.DTO.Image;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface IImageRepository
    {
        // SỬA ĐỔI: Thêm tham số currentUserId tùy chọn
        Task<IEnumerable<ImageDTO>> GetAllAsync(int? currentUserId = null);

        // SỬA ĐỔI: Thêm tham số currentUserId và trả về DTO có thể null
        Task<ImageDTO?> GetByIdAsync(string id, int? currentUserId = null);

        // GIỮ NGUYÊN: Chữ ký hàm CreateAsync đã đúng
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

        // GIỮ NGUYÊN:
        Task<bool> UpdateAsync(string id, UpdateImageDTO dto);

        // GIỮ NGUYÊN:
        Task<bool> DeleteAsync(string id);
    }
}