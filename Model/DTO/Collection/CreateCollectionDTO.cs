namespace DoAnWebAPI.Model.DTO.Collection
{
    public class CreateCollectionDTO
    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; }
        // Cho phép tạo kèm ảnh
        public List<int> ImageIds { get; set; }
    }
}
