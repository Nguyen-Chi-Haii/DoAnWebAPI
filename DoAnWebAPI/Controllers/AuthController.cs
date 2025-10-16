using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.Auth;
using DoAnWebAPI.Services.Interface;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration; // ✅ ĐÃ THÊM
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Claims;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<AuthController> _logger;
        private readonly IConfiguration _configuration; // ✅ ĐÃ THÊM

        // Record cho Login (Fixed 500 error)
        private record FirebaseLoginResult(string idToken, string localId);

        public AuthController(IUserRepository userRepository, ILogger<AuthController> logger, IConfiguration configuration) // ✅ ĐÃ SỬA
        {
            _userRepository = userRepository;
            _logger = logger;
            _configuration = configuration;
        }

        // ✅ Đăng ký bằng Firebase
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var emailExists = await _userRepository.GetUserByEmailAsync(dto.Email);
                if (emailExists != null)
                    return BadRequest(new { Message = "Email already exists" });

                var usernameExists = await _userRepository.GetByUsernameAsync(dto.Username);
                if (usernameExists != null)
                    return BadRequest(new { Message = "Username already exists" });

                // ✅ Tạo user trong Firebase
                var args = new UserRecordArgs
                {
                    Email = dto.Email,
                    Password = dto.Password,
                    DisplayName = dto.Username
                };
                var userRecord = await FirebaseAuth.DefaultInstance.CreateUserAsync(args);

                // Lưu vào DB local
                var newUser = new User
                {
                    Id = await _userRepository.GetNextIdAsync(), // <-- Local Integer ID
                    Username = dto.Username,
                    Email = dto.Email,
                    Role = dto.Role,
                    PasswordHash = dto.Password,
                    AvatarUrl = dto.AvatarUrl ?? "default-avatar.png",
                    CreatedAt = DateTime.UtcNow.ToString("o"),
                    UpdatedAt = DateTime.UtcNow.ToString("o")
                };
                await _userRepository.CreateAsync(newUser);

                // 🔑 FIX LỖI 401: Gán quyền VÀ Local ID vào Custom Claims
                var claims = new Dictionary<string, object>
                {
                    { "role", dto.Role },
                    { "local_id", newUser.Id } // 💡 THÊM LOCAL INTEGER ID VÀO CLAIM
                };
                await FirebaseAuth.DefaultInstance.SetCustomUserClaimsAsync(userRecord.Uid, claims);

                return Ok(new
                {
                    Message = "Registration successful",
                    FirebaseUid = userRecord.Uid
                });
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError($"Firebase error: {ex.Message}");
                return BadRequest(new { Message = "Firebase registration failed", Error = ex.Message });
            }
        }

        // ✅ Đăng nhập bằng email & password (Firebase)
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                using var http = new HttpClient();
                var apiKey = _configuration["Firebase:WebApiKey"]; // ✅ ĐÃ SỬA: Đọc API Key từ Config

                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogError("Firebase Web API Key is missing in configuration.");
                    return StatusCode(500, new { Message = "Server configuration error: Firebase API Key missing." });
                }

                var body = new
                {
                    email = dto.Email,
                    password = dto.Password,
                    returnSecureToken = true
                };

                var response = await http.PostAsJsonAsync(
                    $"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={apiKey}", body);

                if (!response.IsSuccessStatusCode)
                    return Unauthorized(new { Message = "Invalid email or password" });

                var result = await response.Content.ReadFromJsonAsync<FirebaseLoginResult>(); // ✅ ĐÃ SỬA: Fix lỗi 500 JsonElement

                if (result == null)
                {
                    _logger.LogError("Firebase response content is empty or malformed.");
                    return StatusCode(500, new { Message = "Login failed", Error = "Malformed response from Firebase." });
                }

                string idToken = result.idToken;
                string localId = result.localId; // Firebase UID

                var user = await _userRepository.GetUserByEmailAsync(dto.Email);

                // Cập nhật Custom Claims (để đảm bảo token luôn có local_id)
                if (user != null)
                {
                    var claims = new Dictionary<string, object>
                    {
                        { "role", user.Role },
                        { "local_id", user.Id }
                    };
                    await FirebaseAuth.DefaultInstance.SetCustomUserClaimsAsync(localId, claims);
                }


                return Ok(new AuthResponseDTO
                {
                    Token = idToken,
                    UserId = user?.Id.ToString() ?? localId,
                    Username = user?.Username ?? dto.Email,
                    Role = user?.Role ?? "User",
                    ExpiresAt = DateTime.UtcNow.AddHours(1)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login failed");
                return StatusCode(500, new { Message = "Login failed", Error = ex.Message });
            }
        }

        // ✅ Xác minh token Firebase
        [HttpPost("verify-token")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyToken([FromBody] string idToken)
        {
            try
            {
                var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
                return Ok(new
                {
                    Message = "Token valid",
                    Uid = decoded.Uid,
                    Claims = decoded.Claims
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Invalid Firebase token");
                return Unauthorized(new { Message = "Invalid token", Error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var uid = User.FindFirst("user_id")?.Value;
                if (uid == null)
                    return BadRequest(new { Message = "User ID not found" });

                await FirebaseAuth.DefaultInstance.RevokeRefreshTokensAsync(uid);
                return Ok(new { Message = "Logout successful (Firebase tokens revoked)" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Logout failed");
                return StatusCode(500, new { Message = "Logout failed", Error = ex.Message });
            }
        }

        // ✅ Lấy thông tin user hiện tại (Giữ nguyên)
        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            var uid = User.FindFirst("user_id")?.Value;
            var email = User.FindFirst("email")?.Value;
            var localId = User.FindFirst("local_id")?.Value; // Để kiểm tra claim mới
            return Ok(new { Uid = uid, Email = email, LocalId = localId, Message = "Authenticated successfully" });
        }
    }
}