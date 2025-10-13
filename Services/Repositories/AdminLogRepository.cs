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
    }
}