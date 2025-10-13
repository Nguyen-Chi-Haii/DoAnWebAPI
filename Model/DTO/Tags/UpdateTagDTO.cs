using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.Tag;
    public class UpdateTagDTO
    {
        [Required(ErrorMessage = "Tên tag là bắt buộc.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Tên tag phải từ 1 đến 50 ký tự.")]
        public string Name { get; set; }
    }
