namespace DoAnWebAPI.Model.DTO.AdminLog
{
    public class CreateAdminLogDTO
    {
        public string ActionType { get; set; }
        public int Target { get; set; }
        public string Meta { get; set; }
    }
}
