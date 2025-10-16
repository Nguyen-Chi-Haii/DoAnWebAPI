using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI_WebMVC.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập họ và tên của bạn.")]
        [Display(Name = "Họ và tên")]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập địa chỉ email.")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ, vui lòng kiểm tra lại.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        [StringLength(100, ErrorMessage = "Mật khẩu phải có ít nhất {2} ký tự.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Xác nhận mật khẩu")]
        [Compare("Password", ErrorMessage = "Mật khẩu và mật khẩu xác nhận không khớp.")]
        public string ConfirmPassword { get; set; }
    }
}