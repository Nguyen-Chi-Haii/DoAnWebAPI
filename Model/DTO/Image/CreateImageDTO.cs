using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace DoAnWebAPI.Model.DTO.Image
{
    public class CreateImageDTO
    {
        // 🚨 ĐÃ LOẠI BỎ UserId: Controller sẽ tự động lấy UserId từ người dùng đã đăng nhập (Claims).

        [Required]
        [StringLength(255, MinimumLength = 1, ErrorMessage = "Tiêu đề không được để trống và tối đa 255 ký tự.")]
        public string Title { get; set; } = string.Empty; // Tiêu đề ảnh

        [StringLength(1000, ErrorMessage = "Mô tả tối đa 1000 ký tự.")]
        public string? Description { get; set; }         // Mô tả ảnh

        public bool IsPublic { get; set; }               // Ảnh public/private

        // File ảnh upload
        [Required(ErrorMessage = "File ảnh là bắt buộc.")]
        public IFormFile File { get; set; } = null!;

        // Gắn tag & topic
        public List<int> TagIds { get; set; } = new();
        public List<int> TopicIds { get; set; } = new();
    }
}