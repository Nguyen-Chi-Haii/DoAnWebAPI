using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.User;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using FirebaseWebApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly FirebaseService _firebaseService;
        private const string Collection = "users";

        public UserRepository(FirebaseService firebaseService)
        {
            _firebaseService = firebaseService;
        }

        // Helper để map Domain Model sang DTO
        private UserDTO MapToDTO(User user)
        {
            return new UserDTO
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Role = user.Role
            };
        }

        public async Task<int> GetNextIdAsync()
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, User>>(Collection);
            if (dict == null || dict.Count == 0) return 1;

            var maxId = dict.Keys
                .Select(k => int.TryParse(k.Replace("user_", ""), out var id) ? id : 0)
                .Max();
            return maxId + 1;
        }

        // ✅ Thêm mới người dùng (dành cho hệ thống nội bộ)
        public async Task CreateAsync(User user)
        {
            await _firebaseService.SaveDataAsync($"{Collection}/user_{user.Id}", user);
        }

        // ✅ Đăng ký người dùng mới (DTO)
        public async Task<UserDTO?> RegisterAsync(CreateUserDTO dto)
        {
            if (await GetUserByEmailAsync(dto.Email) != null) return null;

            var newUser = new User
            {
                Id = await GetNextIdAsync(),
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = dto.Password,
                Role = "User",
                AvatarUrl = dto.AvatarUrl ?? "default_avatar.png",
                CreatedAt = DateTime.UtcNow.ToString("o"),
                UpdatedAt = DateTime.UtcNow.ToString("o")
            };

            await _firebaseService.SaveDataAsync($"{Collection}/user_{newUser.Id}", newUser);
            return MapToDTO(newUser);
        }

        public async Task<UserDTO?> GetByIdAsync(int id)
        {
            var user = await GetUserDomainByIdAsync(id);
            return user != null ? MapToDTO(user) : null;
        }

        public async Task<User?> GetUserDomainByIdAsync(int id)
        {
            return await _firebaseService.GetDataAsync<User>($"{Collection}/user_{id}");
        }

        public async Task<List<UserDTO>> GetAllAsync()
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, User>>(Collection);
            return dict?.Values.Select(MapToDTO).ToList() ?? new List<UserDTO>();
        }

        // ✅ Bản đúng (theo nhánh kiet1)
        public async Task<bool> UpdateAsync(int id, UpdateUserDTO dto)
        {
            var existingUser = await GetUserDomainByIdAsync(id);
            if (existingUser == null) return false;

            if (dto.Username != null) existingUser.Username = dto.Username;
            if (dto.AvatarUrl != null) existingUser.AvatarUrl = dto.AvatarUrl;

            if (dto.NewPassword != null)
            {
                existingUser.PasswordHash = dto.NewPassword;
            }

            existingUser.UpdatedAt = DateTime.UtcNow.ToString("o");

            await _firebaseService.SaveDataAsync($"{Collection}/user_{id}", existingUser);
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existingUser = await GetUserDomainByIdAsync(id);
            if (existingUser == null) return false;

            await _firebaseService.DeleteDataAsync($"{Collection}/user_{id}");
            return true;
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, User>>(Collection);
            return dict?.Values.FirstOrDefault(x => x.Email == email);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, User>>(Collection);
            return dict?.Values.FirstOrDefault(x =>
                x.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        }
    }
}
