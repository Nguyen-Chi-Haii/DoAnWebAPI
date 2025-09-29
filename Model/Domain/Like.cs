namespace DoAnWebAPI.Model
{
    public class Like
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ImageId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
