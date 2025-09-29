namespace DoAnWebAPI.Model.DTO.Image
{
    public class CreateImageDTO
    {
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string FileUrl { get; set; }
        public string ThumbnailUrl { get; set; }
        public long SizeBytes { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public bool IsPublic { get; set; }
        public List<int> TagIds { get; set; }
        public List<int> TopicIds { get; set; }
    }
}
