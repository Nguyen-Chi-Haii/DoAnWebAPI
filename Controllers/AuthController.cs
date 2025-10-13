using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.Auth;
using DoAnWebAPI.Services.Interface;
using FirebaseWebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/auth")] // api/auth
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public AuthController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // Helper để lấy ID người dùng đã xác thực (chỉ dùng cho Logout nếu dùng [Authorize])
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }

        // POST /api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDTO>> Login([FromBody] LoginDTO dto)
        {
            // ✅ 1. Data Validation
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // FIX: Khai báo biến trước để đảm bảo phạm vi sử dụng (Scope)
            User? user;
            AuthResponseDTO response;

            // 2. Tìm người dùng theo Email
            user = await _userRepository.GetUserByEmailAsync(dto.Email);

            // 3. Kiểm tra người dùng và Mật khẩu
            if (user == null || user.PasswordHash != dto.Password)
            {
                return Unauthorized(new { error = "Thông tin đăng nhập không hợp lệ." });
            }

            // 4. Tạo JWT Token (MOCK)
            var token = "mock_jwt_token_" + user.Id;
            var expires = DateTime.UtcNow.AddHours(2);

            // 5. Tạo đối tượng Response
            response = new AuthResponseDTO
            {
                Token = token,
                UserId = user.Id.ToString(),
                Username = user.Username,
                Role = user.Role,
                ExpiresAt = expires
            };

            // Trả về đối tượng Response
            return Ok(response);
        }

        // POST /api/auth/logout
        [HttpPost("logout")]
        [AllowAnonymous] // 🔑 Đã thay thế [Authorize] để nhận token qua Body
        public IActionResult Logout([FromBody] TokenDTO dto) // 🔑 Nhận TokenDTO từ Body
        {
            // ✅ 1. Data Validation (Tự động)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tokenToRevoke = dto.Token;

            // ⚠️ Cần triển khai logic blacklist/revoke token thực tế tại đây

            return Ok(new { message = $"Đăng xuất/Vô hiệu hóa token thành công. Token: {tokenToRevoke} ." });
        }
    }
}