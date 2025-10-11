using DoAnWebAPI.Model.DTO.Auth;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using FirebaseWebApi.Models;
using DoAnWebAPI.Services;
using System;
using Microsoft.AspNetCore.Authorization;
using FirebaseAdmin.Auth;

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

        // POST api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra email đã tồn tại
            var existingUserByEmail = await _userRepository.GetUserByEmailAsync(dto.Email);
            if (existingUserByEmail != null)
            {
                return BadRequest(new { Message = "Email already exists" });
            }

            // Kiểm tra username đã tồn tại
            var existingUserByUsername = await _userRepository.GetByUsernameAsync(dto.Username);
            if (existingUserByUsername != null)
            {
                return BadRequest(new { Message = "Username already exists" });
            }

            // Kiểm tra quyền gán role
            var currentUser = User.Identity.IsAuthenticated ? await _userRepository.GetByUsernameAsync(User.Identity.Name) : null;
            if (dto.Role != "User" && (currentUser == null || currentUser.Role != "Admin"))
            {
                return Unauthorized(new { Message = "Only admins can assign 'Admin' or 'Moderator' roles" });
            }

            try
            {
                // Tạo user trong Firebase Authentication
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
                    { "role", dto.Role }
                };
                await FirebaseAuth.DefaultInstance.SetCustomUserClaimsAsync(userRecord.Uid, claims);

                // Tạo user trong Realtime Database
                var newUser = new User
                {
                    Id = await _userRepository.GetNextIdAsync(),
                    Username = dto.Username,
                    Email = dto.Email,
                    PasswordHash = null, // Không cần lưu password hash vì Firebase Auth xử lý
                    Role = dto.Role,
                    AvatarUrl = dto.AvatarUrl ?? "default-avatar.png",
                    CreatedAt = DateTime.UtcNow.ToString("o"),
                    UpdatedAt = DateTime.UtcNow.ToString("o")
                };

                await _userRepository.CreateAsync(newUser);

                _logger.LogInformation($"User registered: {dto.Username} with role {dto.Role}");

                return Ok(new { Message = "Registration successful", UserId = newUser.Id, Role = newUser.Role, FirebaseUid = userRecord.Uid });
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError($"Firebase Auth Error: {ex.Message}");
                return BadRequest(new { Message = $"Registration failed: {ex.Message}" });
            }
        }
    }
}