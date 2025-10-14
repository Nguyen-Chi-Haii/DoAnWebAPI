using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.ImageTag
{
    public class UpdateImageTagDTO
    {
        [Required(ErrorMessage = "Image ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Image ID must be a positive integer.")]
        public int ImageId { get; set; }

        [Required(ErrorMessage = "Tag ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Tag ID must be a positive integer.")]
        public int TagId { get; set; }
    }
}
