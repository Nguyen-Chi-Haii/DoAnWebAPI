namespace DoAnWebAPI.Model.DTO.Auth
{
    public class AuthResponseDTO
    {
        public string Token { get; set; } 
        public string UserId { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; }
    }
}