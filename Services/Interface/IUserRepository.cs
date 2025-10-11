using DoAnWebAPI.Model.Domain;
using FirebaseWebApi.Models;

namespace FirebaseWebApi.Repositories
{
    public interface IUserRepository
    {
        Task<User> CreateAsync(User user);
        Task<User?> GetByIdAsync(int id);
        Task<List<User>> GetAllAsync();
        Task UpdateAsync(User user);
        Task DeleteAsync(int id);

        // Custom business logic
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetByUsernameAsync(string username);
        Task<int> GetNextIdAsync();
    }
}
