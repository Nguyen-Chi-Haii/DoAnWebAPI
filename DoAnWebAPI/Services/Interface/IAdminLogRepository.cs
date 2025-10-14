using DoAnWebAPI.Model;

namespace FirebaseWebApi.Repositories
{
    public interface IAdminLogRepository
    {
        Task<AdminLog?> GetByIdAsync(int id);
        Task<List<AdminLog>> GetAllAsync();
    }
}