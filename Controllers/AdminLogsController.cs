using DoAnWebAPI.Model.DTO.AdminLog;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FirebaseWebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminLogsController : ControllerBase
    {
        private readonly IAdminLogRepository _adminLogRepository;

        public AdminLogsController(IAdminLogRepository adminLogRepository)
        {
            _adminLogRepository = adminLogRepository;
        }

        // GET api/admin-logs
        [HttpGet]
        public async Task<IActionResult> GetAllLogs()
        {
            var logs = await _adminLogRepository.GetAllAsync();

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
            var log = await _adminLogRepository.GetByIdAsync(id);
            if (log is null)
                return NotFound();

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