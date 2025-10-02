namespace DoAnWebAPI.Model.DTO.Image
{
    public class CreateImageDTO
    {
        public int UserId { get; set; }                  // Người upload
        public string Title { get; set; } = string.Empty; // Tiêu đề ảnh
        public string? Description { get; set; }         // Mô tả ảnh
        public bool IsPublic { get; set; }               // Ảnh public/private

        // File ảnh upload
        public IFormFile File { get; set; } = null!;

        // Gắn tag & topic
        public List<int> TagIds { get; set; } = new();
        public List<int> TopicIds { get; set; } = new();
    }
}
