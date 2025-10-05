using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.PendingImage;

namespace DoAnWebAPI.Services.Interface
{
    public interface IPendingImageRepository
    {
        Task<List<PendingImage>> GetAllAsync();
        Task<PendingImage?> GetByIdAsync(int id);
        Task<PendingImage?> CreateAsync(CreatePendingImageDTO dto);
        Task<PendingImage?> UpdateStatusAsync(int id, string status, DateTime? reviewedAt);
    }
}
