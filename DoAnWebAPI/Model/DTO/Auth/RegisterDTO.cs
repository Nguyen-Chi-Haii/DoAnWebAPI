using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.Auth
{
    public class RegisterDTO
    {
        [Required(ErrorMessage = "Vui lòng nhập tên tài khoản.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên tài khoản phải có từ 3 đến 50 ký tự.")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập địa chỉ email.")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ, vui lòng kiểm tra lại.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,}$",
            ErrorMessage = "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Vui lòng xác nhận lại mật khẩu.")]
        [Compare("Password", ErrorMessage = "Mật khẩu và mật khẩu xác nhận không khớp.")]
        public string ConfirmPassword { get; set; }

        public string? AvatarUrl { get; set; }
        public string Role { get; set; }
    }
}