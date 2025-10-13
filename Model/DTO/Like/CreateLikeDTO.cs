namespace DoAnWebAPI.Model.DTO.Like
{
    public class CreateLikeDTO
    {
        // 🚨 ĐÃ LOẠI BỎ UserId: Server sẽ lấy UserId an toàn từ token.
        public int ImageId { get; set; }
    }
}