using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.AdminLog;
using DoAnWebAPI.Model.DTO.User;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FirebaseWebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminLogsController : ControllerBase
    {
        private readonly IAdminLogRepository _adminLogRepository;
        private readonly FirebaseService _firebaseService;
        private readonly IUserRepository _userRepository;

        public AdminLogsController(IAdminLogRepository adminLogRepository, FirebaseService firebaseService, IUserRepository userRepository)
        {
            _adminLogRepository = adminLogRepository;
            _firebaseService = firebaseService;
            _userRepository = userRepository;
        }

        // GET api/admin-logs
        [HttpGet]
        public async Task<IActionResult> GetAllLogs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Lấy userId từ token

            var logs = await _adminLogRepository.GetAllAsync();
            if (logs == null || !logs.Any())
            {
                return NotFound("No admin logs found.");
            }

            var adminIds = logs.Select(log => log.AdminId).Distinct().ToList();
            var users = new List<UserDTO>();
            foreach (var adminId in adminIds)
            {
                var user = await _userRepository.GetByIdAsync(adminId);
                if (user != null)
                {
                    users.Add(user);
                }
            }
            var userMap = users.ToDictionary(u => u.Id, u => u.Username);
           
            var dtoList = logs
                // Sắp xếp: Mới nhất lên đầu
                .OrderByDescending(log => log.CreatedAt)
                .Select(log => new AdminLogDTO
                {
                    Id = log.Id,
                    AdminId = log.AdminId,
                    // Lấy tên admin từ map, nếu không thấy thì là "Unknown"
                    AdminUsername = userMap.GetValueOrDefault(log.AdminId, "Unknown Admin"),
                    ActionType = log.ActionType,
                    Target = log.Target,
                    Meta = log.Meta,
                    CreatedAt = log.CreatedAt // ✅ TRẢ VỀ CREATEDAT
                }).ToList();

            return Ok(dtoList);
        }

        // GET api/admin-logs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLogById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Lấy userId từ token

            var log = await _adminLogRepository.GetByIdAsync(id);
            if (log == null)
            {
                return NotFound($"Admin log with ID {id} not found.");
            }

            var dto = new AdminLogDTO
            {
                Id = log.Id,
                AdminId = log.AdminId,
                ActionType = log.ActionType,
                Target = log.Target,
                Meta = log.Meta
            };

            return Ok(dto);
        }
    }
}