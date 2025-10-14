using System.Security.Claims;
using DoAnWebAPI.Model.DTO.AdminLog;
using DoAnWebAPI.Services;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FirebaseWebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminLogsController : ControllerBase
    {
        private readonly IAdminLogRepository _adminLogRepository;
        private readonly FirebaseService _firebaseService;

        public AdminLogsController(IAdminLogRepository adminLogRepository, FirebaseService firebaseService)
        {
            _adminLogRepository = adminLogRepository;
            _firebaseService = firebaseService;
        }

        // GET api/admin-logs
        [HttpGet]
        public async Task<IActionResult> GetAllLogs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Lấy userId từ token
            if (string.IsNullOrEmpty(userId) || !await _firebaseService.IsAdminAsync(userId))
            {
                return StatusCode(403, "Only admins can access this resource.");
            }

            var logs = await _adminLogRepository.GetAllAsync();
            if (logs == null || !logs.Any())
            {
                return NotFound("No admin logs found.");
            }

            var dtoList = logs.Select(log => new AdminLogDTO
            {
                Id = log.Id,
                AdminId = log.AdminId,
                ActionType = log.ActionType,
                Target = log.Target,
                Meta = log.Meta
            }).ToList();

            return Ok(dtoList);
        }

        // GET api/admin-logs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLogById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Lấy userId từ token
            if (string.IsNullOrEmpty(userId) || !await _firebaseService.IsAdminAsync(userId))
            {
                return StatusCode(403, "Only admins can access this resource.");
            }

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