using System.ComponentModel.DataAnnotations;

namespace DoAnWebAPI.Model.DTO.AdminLog
{
    public class AdminLogDTO
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public int AdminId { get; set; }
        public string AdminUsername { get; set; } // Thêm tên Admin
        public DateTime CreatedAt { get; set; } // Thêm ngày giờ

        [Required]
        [StringLength(50, MinimumLength = 1)]
        public string ActionType { get; set; }

        [Required]
        public int Target { get; set; }

        public object Meta { get; set; }
    }
}
