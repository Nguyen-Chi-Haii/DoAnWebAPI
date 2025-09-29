namespace DoAnWebAPI.Model
{
    public class Collection
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
