using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;

namespace DoAnWebAPI.Model.DTO.Image
{
    public class ImageDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string FileUrl { get; set; }
        public string ThumbnailUrl { get; set; }
        public bool IsPublic { get; set; }
        public string Status { get; set; }
        public List<TagDTO> Tags { get; set; }
        public List<TopicDTO> Topics { get; set; }
        public int LikeCount { get; set; } = 0; // Mặc định là 0
        public bool IsLikedByCurrentUser { get; set; } = false; // Mặc định là false

    }
}