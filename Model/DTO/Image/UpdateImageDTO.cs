namespace DoAnWebAPI.Model.DTO.Image
{
    public class UpdateImageDTO
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool? IsPublic { get; set; }
        public string Status { get; set; }
        // Update liên kết cũng bằng Id
        public List<int> TagIds { get; set; }
        public List<int> TopicIds { get; set; }
    }
}
