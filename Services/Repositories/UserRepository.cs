using DoAnWebAPI.Model.Domain;
using FirebaseWebApi.Models;
using FirebaseWebApi.Repositories;

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

        public async Task<User> CreateAsync(User user)
        {
            await _firebaseService.SaveDataAsync($"{Collection}/user_{user.Id}", user);
            return user;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _firebaseService.GetDataAsync<User>($"{Collection}/user_{id}");
        }

        public async Task<List<User>> GetAllAsync()
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, User>>(Collection);
            return dict?.Values.ToList() ?? new List<User>();
        }

        public async Task UpdateAsync(User user)
        {
            user.UpdatedAt = DateTime.UtcNow.ToString("o");
            await _firebaseService.SaveDataAsync($"{Collection}/user_{user.Id}", user);
        }

        public async Task DeleteAsync(int id)
        {
            await _firebaseService.DeleteDataAsync($"{Collection}/user_{id}");
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, User>>(Collection);
            return dict?.Values.FirstOrDefault(x => x.Email == email);
        }
        public async Task<User?> GetByUsernameAsync(string username)
        {
            var users = await GetAllAsync();
            return users.FirstOrDefault(x => x.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        }

        public async Task<int> GetNextIdAsync()
        {
            var users = await GetAllAsync();
            return users.Any() ? users.Max(u => u.Id) + 1 : 1;
        }
    }

}
