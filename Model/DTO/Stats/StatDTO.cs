namespace DoAnWebAPI.Model.DTO.Stats
{
    public class StatDTO
    {
        public int Id { get; set; }
        public int ImageId { get; set; }
        public int ViewsCount { get; set; }
        public int DownloadCount { get; set; }
        public int LikesCount { get; set; }
    }
}