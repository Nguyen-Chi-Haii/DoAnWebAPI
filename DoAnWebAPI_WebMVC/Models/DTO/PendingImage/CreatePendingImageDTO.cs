namespace DoAnWebAPI.Model.DTO.PendingImage
{
    public class CreatePendingImageDTO
    {
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public IFormFile File { get; set; }
    }
}
