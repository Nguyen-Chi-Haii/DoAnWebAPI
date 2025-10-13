using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.ImageTopic
{
    public class ImageTopicDTO
    {
        [Required(ErrorMessage = "ImageId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "ImageId must be a positive integer.")]
        public int ImageId { get; set; }

        [Required(ErrorMessage = "TopicId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "TopicId must be a positive integer.")]
        public int TopicId { get; set; }

        [Required(ErrorMessage = "CreatedAt is required.")]
        [DataType(DataType.DateTime, ErrorMessage = "Invalid date format for CreatedAt.")]
        public DateTime CreatedAt { get; set; }
    }
}
