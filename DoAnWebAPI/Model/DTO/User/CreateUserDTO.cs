using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.User
{
    public class CreateUserDTO
    {
        [Required(ErrorMessage = "Username là bắt buộc.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username phải có từ 3 đến 50 ký tự.")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [StringLength(100, ErrorMessage = "Email tối đa 100 ký tự.")]
        public string Email { get; set; }

        // ✅ Chấp nhận plain password từ client, server sẽ hash
        [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        public string Password { get; set; }
        public string? AvatarUrl { get; set; } // Đặt là nullable
    }
}