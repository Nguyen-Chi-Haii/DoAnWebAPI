using DoAnWebAPI.Model.DTO.Image;

namespace DoAnWebAPI.Services.Interface
{
    public interface IImageRepository
    {
        Task<IEnumerable<ImageDTO>> GetAllAsync();
        Task<ImageDTO> GetByIdAsync(int imageId);
        Task<ImageDTO> CreateAsync(CreateImageDTO dto, string fileUrl, string thumbnailUrl, long size, int width, int height);
        Task<bool> UpdateAsync(int id, UpdateImageDTO dto); 
        Task<bool> DeleteAsync(int id); 
    }
}
