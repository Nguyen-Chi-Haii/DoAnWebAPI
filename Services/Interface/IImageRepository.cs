using DoAnWebAPI.Model.DTO.Image;

namespace DoAnWebAPI.Services.Interface
{
    public interface IImageRepository
    {
        Task<IEnumerable<ImageDTO>> GetAllAsync();
        Task<ImageDTO> GetByIdAsync(string id);
        Task<ImageDTO> CreateAsync(CreateImageDTO dto, string fileUrl, string thumbnailUrl, long size, int width, int height);
        Task<bool> UpdateAsync(string id, UpdateImageDTO dto);
        Task<bool> DeleteAsync(string id);
    }
}
