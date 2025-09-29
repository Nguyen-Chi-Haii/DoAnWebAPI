using DoAnWebAPI.Model.DTO.Image;

namespace DoAnWebAPI.Model.DTO.Collection
{
    public class CollectionDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public bool IsPublic { get; set; }
        public List<ImageDTO> Images { get; set; }
    }
}
