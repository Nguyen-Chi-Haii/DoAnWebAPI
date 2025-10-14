namespace DoAnWebAPI.Model.DTO.Collection
{
    public class UpdateCollectionDTO
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool? IsPublic { get; set; }
        public List<int> ImageIds { get; set; }
    }
}
