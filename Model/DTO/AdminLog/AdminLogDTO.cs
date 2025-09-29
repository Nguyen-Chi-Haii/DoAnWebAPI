namespace DoAnWebAPI.Model.DTO.AdminLog
{
    public class AdminLogDTO
    {
        public int Id { get; set; }
        public int AdminId { get; set; }
        public string ActionType { get; set; }
        public int Target { get; set; }
        public string Meta { get; set; }
    }
}
