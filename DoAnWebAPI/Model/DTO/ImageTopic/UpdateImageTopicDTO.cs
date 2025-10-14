using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.ImageTopic
{
    public class UpdateImageTopicDTO
    {
        [Required(ErrorMessage = "ImageId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "ImageId must be a positive integer.")]
        public int ImageId { get; set; }

        [Required(ErrorMessage = "TopicId is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "TopicId must be a positive integer.")]
        public int TopicId { get; set; }
    }
}
