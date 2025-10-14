namespace DoAnWebAPI.Model.DTO.ImageTag
{
    public class ImageTagDTO
    {
        public int ImageId { get; set; }
        public string ImageUrl { get; set; }    // tuỳ chọn nếu bạn muốn hiển thị ảnh
        public int TagId { get; set; }
        public string TagName { get; set; }     // tuỳ chọn nếu bạn muốn hiển thị tên tag
    }
}
