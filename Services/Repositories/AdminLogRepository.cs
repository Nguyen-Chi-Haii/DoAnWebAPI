using DoAnWebAPI.Model;
using FirebaseWebApi.Repositories;

namespace DoAnWebAPI.Services.Repositories
{
    public class AdminLogRepository : IAdminLogRepository
    {
        private readonly FirebaseService _firebaseService;
        private readonly ILogger<AdminLogRepository> _logger; // Thêm
        private const string Collection = "admin_logs";

        public AdminLogRepository(FirebaseService firebaseService)
        {
            _firebaseService = firebaseService;
        }

        public async Task<List<AdminLog>> GetAllAsync()
        {
            try
            {
                var dict = await _firebaseService.GetDataAsync<Dictionary<string, AdminLog>>(Collection);
                return dict?.Values.ToList() ?? new List<AdminLog>();
            }
            catch (Exception ex)
            {
                // Log và return empty hoặc throw custom
                return new List<AdminLog>(); // Hoặc throw nếu critical
            }
        }

        public async Task<AdminLog?> GetByIdAsync(int id)
        {
            return await _firebaseService.GetDataAsync<AdminLog>($"{Collection}/log_{id}");
        }
    }
}