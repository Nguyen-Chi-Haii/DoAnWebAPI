using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.Topics
{
    public class UpdateTopicDTO
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; }
    }
}
