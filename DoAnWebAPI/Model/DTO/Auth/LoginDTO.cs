using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.Auth
{
    public class LoginDTO
    {
        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
        public string Password { get; set; }
    }
}