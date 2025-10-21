
namespace DoAnWebAPI.Model.DTO.Topics
{
    public class TopicDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime? CreatedAt { get; internal set; }
        public int ImageCount { get; internal set; }
    }
}
