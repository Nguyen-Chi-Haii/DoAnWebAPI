using DoAnWebAPI.Model.Domain; // ✅ Đảm bảo lớp User được import
using DoAnWebAPI.Model.DTO.Auth;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using FirebaseWebApi.Repositories; // ⚠️ Thêm nếu dự án đang dùng
using FirebaseWebApi.Models;       // ⚠️ Thêm nếu dự án có Models liên quan

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly FirebaseService _firebaseService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserRepository userRepository, FirebaseService firebaseService, ILogger<AuthController> logger)
        {
            _userRepository = userRepository;
            _firebaseService = firebaseService;
            _logger = logger;
        }

        // Helper để lấy ID người dùng đã xác thực (chỉ dùng nếu sử dụng [Authorize] với JWT)
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }

        // POST api/auth/register (Firebase Auth + Mock JWT)
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 1. Kiểm tra tồn tại
            var existingUserByEmail = await _userRepository.GetUserByEmailAsync(dto.Email);
            if (existingUserByEmail != null)
            {
                return BadRequest(new { Message = "Email already exists" });
            }

            var existingUserByUsername = await _userRepository.GetByUsernameAsync(dto.Username);
            if (existingUserByUsername != null)
            {
                return BadRequest(new { Message = "Username already exists" });
            }

            // 2. Kiểm tra quyền gán role
            var currentUsername = User.Identity?.Name;
            var currentUser = (User.Identity?.IsAuthenticated == true && currentUsername != null)
                              ? await _userRepository.GetByUsernameAsync(currentUsername) : null;

            string targetRole = dto.Role;

            if (targetRole != "User" && (currentUser == null || currentUser.Role != "Admin"))
            {
                if (targetRole != "User")
                {
                    return Unauthorized(new { Message = "Only admins can assign 'Admin' or 'Moderator' roles" });
                }
            }

            try
            {
                // 3. Tạo user trong Firebase Authentication
                var userRecordArgs = new UserRecordArgs
                {
                    Email = dto.Email,
                    Password = dto.Password,
                    DisplayName = dto.Username
                };
                var userRecord = await FirebaseAuth.DefaultInstance.CreateUserAsync(userRecordArgs);

                // Gán custom claims cho role
                var claims = new System.Collections.Generic.Dictionary<string, object>
                {
                    { "role", targetRole }
                };
                await FirebaseAuth.DefaultInstance.SetCustomUserClaimsAsync(userRecord.Uid, claims);

                // 4. Tạo user trong Realtime Database
                var newUser = new User
                {
                    Id = await _userRepository.GetNextIdAsync(),
                    Username = dto.Username,
                    Email = dto.Email,
                    // ⚠️ FIX: Lưu mật khẩu gốc để mock login hoạt động
                    PasswordHash = dto.Password,
                    Role = targetRole,
                    AvatarUrl = dto.AvatarUrl ?? "default-avatar.png",
                    CreatedAt = DateTime.UtcNow.ToString("o"),
                    UpdatedAt = DateTime.UtcNow.ToString("o")
                };

                await _userRepository.CreateAsync(newUser);

                _logger.LogInformation($"User registered: {dto.Username} with role {targetRole}");

                return Ok(new { Message = "Registration successful", UserId = newUser.Id, Role = newUser.Role, FirebaseUid = userRecord.Uid });
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError($"Firebase Auth Error: {ex.Message}");
                return BadRequest(new { Message = $"Registration failed: {ex.Message}" });
            }
        }

        // POST /api/auth/login (Mock JWT)
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponseDTO>> Login([FromBody] LoginDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userRepository.GetUserByEmailAsync(dto.Email);

            // Kiểm tra user và mật khẩu
            if (user == null || user.PasswordHash != dto.Password)
            {
                return Unauthorized(new { error = "Thông tin đăng nhập không hợp lệ." });
            }

            var token = "mock_jwt_token_" + user.Id;
            var expires = DateTime.UtcNow.AddHours(2);

            var response = new AuthResponseDTO
            {
                Token = token,
                UserId = user.Id.ToString(),
                Username = user.Username,
                Role = user.Role,
                ExpiresAt = expires
            };

            return Ok(response);
        }

        // POST /api/auth/logout
        [HttpPost("logout")]
        [AllowAnonymous]
        public IActionResult Logout([FromBody] TokenDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tokenToRevoke = dto.Token;
            return Ok(new { message = $"Đăng xuất/Vô hiệu hóa token thành công. Token: {tokenToRevoke}." });
        }
    }
}
