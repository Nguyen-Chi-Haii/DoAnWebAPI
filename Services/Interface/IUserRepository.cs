using DoAnWebAPI.Model.Domain;

namespace FirebaseWebApi.Repositories
{
    public interface IUserRepository
    {
        Task<User> CreateAsync(User user);
        Task<User?> GetByIdAsync(int id);
        Task<List<User>> GetAllAsync();
        Task UpdateAsync(int id, User user);
        Task DeleteAsync(int id);

        // Custom business logic
        Task<User?> GetUserByEmailAsync(string email);
    }
}
