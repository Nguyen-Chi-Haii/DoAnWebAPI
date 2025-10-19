using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/tags
    [Authorize] // Mặc định yêu cầu xác thực
    public class TagsController : ControllerBase
    {
        private readonly ITagRepository _tagRepository;
        private readonly IAdminLogRepository _adminLogRepository;

        public TagsController(ITagRepository tagRepository, IAdminLogRepository adminLogRepository)
        {
            _tagRepository = tagRepository;
            _adminLogRepository = adminLogRepository;
        }

        // Helper để kiểm tra Admin (Giả định Role Claim tồn tại)
        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                // Fallback hoặc logic khác nếu cần
                var localIdClaim = User.FindFirst("local_id");
                if (localIdClaim != null && int.TryParse(localIdClaim.Value, out userId))
                {
                    return userId;
                }
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }
        // GET /api/tags
        [HttpGet]
        [AllowAnonymous] // 🔑 User và Guest đều có thể xem danh sách tags
        public async Task<ActionResult<IEnumerable<TagDTO>>> GetAll()
        {
            var tags = await _tagRepository.GetAllAsync();
            return Ok(tags);
        }

        // GET /api/tags/{id}
        [HttpGet("{id}")]
        [AllowAnonymous] // 🔑 User và Guest đều có thể xem chi tiết tag
        public async Task<ActionResult<TagDTO>> GetById(int id) // Sử dụng int
        {
            // ✅ Data Validation
            if (id <= 0)
            {
                return BadRequest("ID Tag không hợp lệ.");
            }

            var tag = await _tagRepository.GetByIdAsync(id);
            if (tag == null) return NotFound();
            return Ok(tag);
        }

        // POST /api/tags
        [HttpPost]
        [Authorize(Roles = "Admin")] // 🔑 Chỉ Admin mới được tạo Tag
        public async Task<ActionResult<TagDTO>> Create([FromBody] CreateTagDTO dto)
        {
            // ✅ Data Validation: Kiểm tra tự động qua ModelState.IsValid
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 🔑 Phân quyền: Đã được xử lý bởi [Authorize(Roles = "Admin")]

            var createdTag = await _tagRepository.CreateAsync(dto);
            try
            {
                var adminId = GetCurrentUserId();
                var log = new AdminLog
                {
                    AdminId = adminId,
                    ActionType = "CREATE_TAG",
                    Target = createdTag.Id,
                    Meta = $"Created tag: {createdTag.Name}",
                };
                _ = _adminLogRepository.CreateAsync(log); // Fire-and-forget
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to create admin log: {ex.Message}");
            }
            return CreatedAtAction(nameof(GetById), new { id = createdTag.Id }, createdTag);
        }

        // PUT /api/tags/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // 🔑 Chỉ Admin mới được sửa Tag
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTagDTO dto) // Sử dụng int
        {
            // ✅ Data Validation
            if (id <= 0)
            {
                return BadRequest("ID Tag không hợp lệ.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 🔑 Phân quyền: Đã được xử lý bởi [Authorize(Roles = "Admin")]

            var result = await _tagRepository.UpdateAsync(id, dto);
            if (result == false) return NotFound(); // Dùng false thay vì null
            return NoContent();
        }

        // DELETE /api/tags/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // 🔑 Chỉ Admin mới được xóa Tag
        public async Task<IActionResult> Delete(int id) // Sử dụng int
        {
            // ✅ Data Validation
            if (id <= 0)
            {
                return BadRequest("ID Tag không hợp lệ.");
            }

            // 🔑 Phân quyền: Đã được xử lý bởi [Authorize(Roles = "Admin")]
            var tagToLog = await _tagRepository.GetByIdAsync(id);
            if (tagToLog == null) return NotFound();

            var result = await _tagRepository.DeleteAsync(id);
            if (!result) return NotFound();

            // ✅ GHI LOG HÀNH ĐỘNG
            try
            {
                var adminId = GetCurrentUserId();
                var log = new AdminLog
                {
                    AdminId = adminId,
                    ActionType = "DELETE_TAG",
                    Target = id,
                    Meta = $"Deleted tag: {tagToLog.Name} (ID: {id})",
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