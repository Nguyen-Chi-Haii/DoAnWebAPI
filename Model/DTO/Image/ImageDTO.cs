using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;

namespace DoAnWebAPI.Model.DTO.Image
{
    public class ImageDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string FileUrl { get; set; }
        public string ThumbnailUrl { get; set; }
        public bool IsPublic { get; set; }
        public string Status { get; set; }
        public List<TagDTO> Tags { get; set; }
        public List<TopicDTO> Topics { get; set; }
    }
}
