using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.User;
using DoAnWebAPI.Services.Interface;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/users
    [Authorize] // Mặc định yêu cầu xác thực trừ khi [AllowAnonymous]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        // Add a private readonly field for IAdminLogRepository
        private readonly IAdminLogRepository _adminLogRepository;

        public UsersController(IUserRepository userRepository,IAdminLogRepository adminLogRepository)
        {
            _userRepository = userRepository;
            _adminLogRepository = adminLogRepository;
        }

        // Helper để lấy ID người dùng đã xác thực
        private int? GetCurrentUserIdOrDefault()
        {
            var userIdClaim = User.FindFirst("local_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }

        // Helper để kiểm tra quyền Admin HOẶC chính người dùng đó
        private bool IsAdminOrSameUser(int targetUserId)
        {
            if (User.IsInRole("Admin")) return true;
            try
            {
                var userId = GetCurrentUserIdOrDefault();
                return userId == targetUserId;
            }
            catch { return false; }
        }

        // Helper để kiểm tra Admin
        private bool IsAdmin()
        {
            // Note: Firebase Custom Claims cho role thường là "role". Cần đảm bảo Role Claim được set đúng.
            return User.HasClaim("role", "Admin") || User.IsInRole("Admin");
        }


        // POST /api/users (Đăng ký)
        [HttpPost]
        [AllowAnonymous] // 🔑 Đăng ký là công khai
        public async Task<ActionResult<UserDTO>> Register([FromBody] CreateUserDTO dto)
        {
            // ✅ Data Validation: DTO Validation
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdUser = await _userRepository.RegisterAsync(dto);
            if (createdUser == null)
            {
                return Conflict("Email hoặc Username đã tồn tại.");
            }

            return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdUser);
        }

        // GET /api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetAll()
        {
            // 🔑 Phân quyền: Chỉ Admin mới được lấy danh sách tất cả người dùng
            if (!IsAdmin())
            {
                // 💡 FIX: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn không có quyền xem danh sách người dùng." });
            }

            var users = await _userRepository.GetAllAsync();
            return Ok(users);
        }

        // GET /api/users/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDTO>> GetById(int id)
        {
            // ✅ Data Validation
            if (id <= 0)
            {
                return BadRequest("ID User không hợp lệ.");
            }

            // 🔑 Phân quyền: Admin HOẶC Same User
            if (!IsAdminOrSameUser(id))
            {
                // 💡 FIX: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn không có quyền xem hồ sơ người dùng này." });
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] UpdateUserDTO dto)
        {
            // 1. Validation
            if (id <= 0)
            {
                return BadRequest("ID User không hợp lệ.");
            }

            // Kiểm tra xem ID "me" hay là ID số
            int targetUserId = id;
            if (id.ToString().ToLower() == "me") // Cho phép dùng "me"
            {
                try
                {
                    targetUserId = (int)GetCurrentUserIdOrDefault(); // Lấy ID của user đang đăng nhập
                }
                catch (UnauthorizedAccessException ex)
                {
                    return Unauthorized(new { Message = ex.Message });
                }
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 2. Phân quyền: Admin HOẶC Same User
            if (!IsAdminOrSameUser(targetUserId))
            {
                return StatusCode(403, new { Message = "Bạn không có quyền cập nhật hồ sơ người dùng này." });
            }

            // 3. Gọi Repository (Repository của bạn CẦN được cập nhật để xử lý DTO này)
            // (Bạn cần truyền cả file và dữ liệu text đến repository)
            var result = await _userRepository.UpdateAsync(targetUserId, dto);

            if (!result)
            {
                return NotFound("Không tìm thấy người dùng.");
            }

            return NoContent();
        }

        // DELETE /api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // ✅ Data Validation
            if (id <= 0)
            {
                return BadRequest("ID User không hợp lệ.");
            }

            // 🔑 Phân quyền: Admin HOẶC Same User
            if (!IsAdminOrSameUser(id))
            {
                // 💡 FIX: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn không có quyền xóa hồ sơ người dùng này." });
            }

            var userToLog = await _userRepository.GetByIdAsync(id);
            if (userToLog == null) return NotFound();

            var result = await _userRepository.DeleteAsync(id);
            if (!result) return NotFound();

            // ✅ GHI LOG HÀNH ĐỘNG
            try
            {
                var adminId = GetCurrentUserIdOrDefault(); // Lấy ID admin đang thực hiện
                var log = new AdminLog
                {
                    AdminId = (int)adminId,
                    ActionType = "DELETE_USER",
                    Target = id,
                    Meta = $"Deleted user: {userToLog.Username} (Email: {userToLog.Email})",
                };
                await _adminLogRepository.CreateAsync(log);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi nếu không tạo được AdminLog, nhưng không làm hỏng request chính
                Console.WriteLine($"Failed to create admin log: {ex.Message}");
            }
            return NoContent();
        }
    }
}