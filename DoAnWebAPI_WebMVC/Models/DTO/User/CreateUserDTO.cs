namespace DoAnWebAPI.Model.DTO.User
{
    public class CreateUserDTO
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
        public string AvatarUrl { get; set; }
    }
}
