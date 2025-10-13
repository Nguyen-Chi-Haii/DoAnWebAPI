using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace DoAnWebAPI.Model.DTO.Collection
{
    public class UpdateCollectionDTO
    {
        [Required(ErrorMessage = "Tên bộ sưu tập là bắt buộc.")]
        [MaxLength(255, ErrorMessage = "Tên không được vượt quá 255 ký tự.")]
        public string Name { get; set; }

        [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự.")]
        public string Description { get; set; }

        public bool? IsPublic { get; set; }
        public List<int> ImageIds { get; set; }
    }
}