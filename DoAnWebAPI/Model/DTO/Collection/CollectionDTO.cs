using DoAnWebAPI.Model.DTO.Image;
using System;
using System.Collections.Generic;

namespace DoAnWebAPI.Model.DTO.Collection
{
    // DTO dùng để trả về dữ liệu bộ sưu tập (GET responses)
    public class CollectionDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; }

        // Dữ liệu hình ảnh chi tiết được nhúng
        public List<ImageDTO> Images { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}