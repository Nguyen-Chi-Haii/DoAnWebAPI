using DoAnWebAPI.Model;
using FirebaseWebApi.Repositories;

namespace DoAnWebAPI.Services.Repositories
{
    public class AdminLogRepository : IAdminLogRepository
    {
        private readonly FirebaseService _firebaseService;
        private readonly ILogger<AdminLogRepository> _logger; 
        private const string Collection = "admin_logs";

        public AdminLogRepository(FirebaseService firebaseService, ILogger<AdminLogRepository> logger)
        {
            _firebaseService = firebaseService;
            _logger = logger;
        }

        public async Task<List<AdminLog>> GetAllAsync()
        {
            try
            {
                var dict = await _firebaseService.GetDataAsync<Dictionary<string, AdminLog>>(Collection);
                var logs = dict?.Values.ToList() ?? new List<AdminLog>();

                // Kiểm tra tính hợp lệ của từng log
                var validLogs = logs.Where(log =>
                    log.Id > 0 &&
                    log.AdminId > 0 &&
                    !string.IsNullOrEmpty(log.ActionType) &&
                    log.ActionType.Length <= 50 &&
                    log.Target > 0).ToList();

                if (logs.Count != validLogs.Count)
                {
                    _logger.LogWarning("Some admin logs were filtered out due to invalid data.");
                }

                return validLogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin logs.");
                return new List<AdminLog>();
            }
        }

        public async Task<AdminLog?> GetByIdAsync(int id)
        {
            try
            {
                if (id <= 0)
                {
                    _logger.LogWarning("Invalid log ID: {Id}", id);
                    return null;
                }

                var log = await _firebaseService.GetDataAsync<AdminLog>($"{Collection}/log_{id}");
                if (log == null)
                {
                    return null;
                }

                // Kiểm tra tính hợp lệ của log
                if (log.AdminId <= 0 ||
                    string.IsNullOrEmpty(log.ActionType) ||
                    log.ActionType.Length > 50 ||
                    log.Target <= 0)
                {
                    _logger.LogWarning("Invalid admin log data for ID: {Id}", id);
                    return null;
                }

                return log;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin log with ID: {Id}", id);
                return null;
            }
        }
        public async Task<int> GetNextIdAsync()
        {
            var dict = await _firebaseService.GetDataAsync<Dictionary<string, AdminLog>>(Collection);
            if (dict == null || dict.Count == 0) return 1;

            var maxId = dict.Values.Select(log => log.Id).DefaultIfEmpty(0).Max();
            return maxId + 1;
        }

        // ✅ BƯỚC 1.2: THÊM HÀM CREATEASYNC
        public async Task<AdminLog> CreateAsync(AdminLog adminLog)
        {
            try
            {
                // Tự động gán ID và thời gian
                adminLog.Id = await GetNextIdAsync();
                adminLog.CreatedAt = DateTime.UtcNow;

                await _firebaseService.SaveDataAsync($"{Collection}/log_{adminLog.Id}", adminLog);
                _logger.LogInformation("AdminLog created with ID {Id}", adminLog.Id);
                return adminLog;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating admin log");
                throw;
            }
        }
    }
}