namespace DoAnWebAPI.Model
{
    public class Stat
    {
        public int Id { get; set; }
        public int ImageId { get; set; }
        public int ViewsCount { get; set; }
        public int DownloadCount { get; set; }
        public int LikesCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}