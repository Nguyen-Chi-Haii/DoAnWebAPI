using DoAnWebAPI.Model.DTO.User;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/users
    [Authorize] // Mặc định yêu cầu xác thực trừ khi [AllowAnonymous]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // Helper để lấy ID người dùng đã xác thực
        private int GetCurrentUserId()
        {
            // Trong trường hợp sử dụng Firebase, ClaimTypes.NameIdentifier thường là Firebase UID (string), 
            // nhưng code này đang cố gắng parse sang int. 
            // Nếu User ID trong DB local là int, cần đảm bảo ClaimTypes.NameIdentifier cũng là int hoặc lấy ID từ Claim khác.
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                // Nếu không phải int, thử tìm claim khác hoặc dựa vào logic map Firebase UID sang DB local ID.
                // Hiện tại, ta giữ nguyên logic, nếu fail sẽ throw UnauthorizedAccessException.
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }

        // Helper để kiểm tra quyền Admin HOẶC chính người dùng đó
        private bool IsAdminOrSameUser(int targetUserId)
        {
            if (User.IsInRole("Admin")) return true;
            try
            {
                return GetCurrentUserId() == targetUserId;
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

        // PUT /api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDTO dto)
        {
            // ✅ Data Validation
            if (id <= 0)
            {
                return BadRequest("ID User không hợp lệ.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 🔑 Phân quyền: Admin HOẶC Same User
            if (!IsAdminOrSameUser(id))
            {
                // 💡 FIX: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn không có quyền cập nhật hồ sơ người dùng này." });
            }

            var result = await _userRepository.UpdateAsync(id, dto);
            if (!result) return NotFound("Không tìm thấy người dùng.");
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

            var result = await _userRepository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}