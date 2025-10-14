using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.User
{
    public class UpdateUserDTO
    {
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username phải có từ 3 đến 50 ký tự.")]
        public string? Username { get; set; }

        [Url(ErrorMessage = "AvatarUrl không phải là URL hợp lệ.")]
        public string? AvatarUrl { get; set; }

        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
        public string? NewPassword { get; set; }
    }
}