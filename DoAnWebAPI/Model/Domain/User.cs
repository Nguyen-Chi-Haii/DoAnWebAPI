namespace DoAnWebAPI.Model.Domain
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PasswordHash { get; set; } 
        public string Role { get; set; } = "User";
        public string Status { get; set; } = "Active";
        public string? AvatarUrl { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string UpdatedAt { get; set; } = string.Empty;
    }
}