using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace DoAnWebAPI.Model.DTO.Image
{
    public class UpdateImageDTO
    {
        [Required(ErrorMessage = "Tiêu đề không được để trống.")]
        [StringLength(255, MinimumLength = 1, ErrorMessage = "Tiêu đề tối đa 255 ký tự.")]
        public string Title { get; set; }

        [StringLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự.")]
        public string Description { get; set; }

        public bool? IsPublic { get; set; }

        [Required(ErrorMessage = "Status không được để trống.")]
        [StringLength(50, ErrorMessage = "Status tối đa 50 ký tự.")]
        public string Status { get; set; }
        // Update liên kết cũng bằng Id
        public List<int> TagIds { get; set; }
        public List<int> TopicIds { get; set; }
    }
}