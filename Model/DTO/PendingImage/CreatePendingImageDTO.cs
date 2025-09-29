namespace DoAnWebAPI.Model.DTO.PendingImage
{
    public class CreatePendingImageDTO
    {
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string FileUrl { get; set; }
        public string ThumbnailUrl { get; set; }
        public long SizeBytes { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
    }
}
