using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.User;
using FirebaseWebApi.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Interface
{
    public interface IUserRepository
    {
        Task<UserDTO?> RegisterAsync(CreateUserDTO dto);
        Task<UserDTO?> GetByIdAsync(int id);
        Task<List<UserDTO>> GetAllAsync();
        Task<bool> UpdateAsync(int id, UpdateUserDTO dto);
        Task<bool> DeleteAsync(int id);

        Task CreateAsync(User user);

        // Tất cả đều trả về User?
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserDomainByIdAsync(int id);
        Task<User?> GetByUsernameAsync(string username);
        Task<int> GetNextIdAsync();
    }
}
