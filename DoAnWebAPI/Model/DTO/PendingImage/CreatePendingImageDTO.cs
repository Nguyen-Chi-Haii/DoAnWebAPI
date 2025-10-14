using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.PendingImage
{
    public class CreatePendingImageDTO
    {
        [Required(ErrorMessage = "User ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "User ID must be a positive number.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "The title is required.")]
        [StringLength(100, ErrorMessage = "The title must not exceed 100 characters.")]
        public string Title { get; set; }

        [StringLength(500, ErrorMessage = "The description must not exceed 500 characters.")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Please provide the image file.")]
        public IFormFile File { get; set; }
    }
}
