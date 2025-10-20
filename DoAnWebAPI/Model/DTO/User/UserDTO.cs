namespace DoAnWebAPI.Model.DTO.User 
{
    public class UserDTO
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string AvatarUrl { get; set; }
        public string Role { get; set; }
        public string Status { get; set; } = "Active";
        public IFormFile AvatarFile { get; set; }

        public DateTime CreatedAt { get; set; }
        
    }
}