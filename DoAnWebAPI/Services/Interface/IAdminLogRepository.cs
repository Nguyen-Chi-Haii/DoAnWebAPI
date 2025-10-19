using DoAnWebAPI.Model;

namespace FirebaseWebApi.Repositories
{
    public interface IAdminLogRepository
    {
        Task<AdminLog> CreateAsync(AdminLog adminLog); // ✅ Phải có dòng này
        Task<List<AdminLog>> GetAllAsync();
        Task<AdminLog?> GetByIdAsync(int id);
        Task<int> GetNextIdAsync();
    }
}