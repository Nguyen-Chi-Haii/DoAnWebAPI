using DoAnWebAPI.Model.DTO.Image;

namespace DoAnWebAPI.Model.DTO.Tag
{
    public class TagDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        
        public List<ImageDTO> Images { get; set; }
        }
}
