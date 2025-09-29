namespace DoAnWebAPI.Model.DTO.PendingImage
{
    public class PendingImageDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string ThumbnailUrl { get; set; }
        public string Status { get; set; }
    }
}
