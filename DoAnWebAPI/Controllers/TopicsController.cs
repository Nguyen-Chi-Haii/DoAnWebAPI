using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController : ControllerBase
    {
        private readonly ITopicRepository _topicRepository;
        private readonly IAdminLogRepository _adminLogRepository;

        public TopicsController(ITopicRepository topicRepository, IAdminLogRepository adminLogRepository)
        {
            _topicRepository = topicRepository;
            _adminLogRepository = adminLogRepository;
        }
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                var localIdClaim = User.FindFirst("local_id");
                if (localIdClaim != null && int.TryParse(localIdClaim.Value, out userId))
                {
                    return userId;
                }
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<TopicDTO>>> GetAll()
        {
            var topics = await _topicRepository.GetAllAsync();
            var dtos = topics.Select(t => new TopicDTO { Id = t.Id, Name = t.Name }).ToList();
            return Ok(dtos);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<TopicDTO>> Create([FromBody] CreateTopicDTO createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _topicRepository.CreateAsync(createDto);
            try
            {
                var adminId = GetCurrentUserId();
                var log = new AdminLog
                {
                    AdminId = adminId,
                    ActionType = "CREATE_TOPIC",
                    Target = created.Id,
                    Meta = $"Created topic: {created.Name}",
                };
                _ = _adminLogRepository.CreateAsync(log); // Fire-and-forget
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to create admin log: {ex.Message}");
            }

            var dto = new TopicDTO { Id = created.Id, Name = created.Name };
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, dto);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<TopicDTO>> Update(int id, [FromBody] UpdateTopicDTO updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _topicRepository.UpdateAsync(id, updateDto);
            if (updated == null) return NotFound();
            var dto = new TopicDTO { Id = updated.Id, Name = updated.Name };
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var topicToLog = await _topicRepository.GetByIdAsync(id); // Giả định hàm này tồn tại
            if (topicToLog == null) return NotFound();

            var success = await _topicRepository.DeleteAsync(id);
            if (!success) return NotFound();

            // ✅ GHI LOG HÀNH ĐỘNG
            try
            {
                var adminId = GetCurrentUserId();
                var log = new AdminLog
                {
                    AdminId = adminId,
                    ActionType = "DELETE_TOPIC",
                    Target = id,
                    Meta = $"Deleted topic: {topicToLog.Name} (ID: {id})",
                };
                _ = _adminLogRepository.CreateAsync(log); // Fire-and-forget
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to create admin log: {ex.Message}");
            }
            return NoContent();
        }
    }
}
