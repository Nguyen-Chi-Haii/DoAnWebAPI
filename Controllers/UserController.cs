using DoAnWebAPI.Model.DTO.User;
using DoAnWebAPI.Model.DTO.UserDTO;
using FirebaseWebApi.Models;
using FirebaseWebApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FirebaseWebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // POST api/users
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDTO dto)
        {
            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                Role = dto.Role,
                AvatarUrl = dto.AvatarUrl,
                CreatedAt = DateTime.UtcNow.ToString("o"),
                UpdatedAt = DateTime.UtcNow.ToString("o"),
            };

            var createdUser = await _userRepository.CreateAsync(user);

            var response = new UserDTO
            {
                Id = createdUser.Id,
                Username = createdUser.Username,
                Email = createdUser.Email,
                Role = createdUser.Role,
                AvatarUrl = createdUser.AvatarUrl,
            };

            return CreatedAtAction(nameof(GetUser), new { id = response.Id }, response);
        }

        // GET api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user is null)
                return NotFound();

            var dto = new UserDTO
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                AvatarUrl = user.AvatarUrl
            };

            return Ok(dto);
        }

        // GET api/users
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();

            var dtoList = users.Select(user => new UserDTO
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                AvatarUrl = user.AvatarUrl
            }).ToList();

            return Ok(dtoList);
        }

        // PUT api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDTO dto)
        {
            var existing = await _userRepository.GetByIdAsync(id);
            if (existing is null)
                return NotFound();

            existing.Username = dto.Username ?? existing.Username;
            existing.Role = dto.Role ?? existing.Role;
            existing.AvatarUrl = dto.AvatarUrl ?? existing.AvatarUrl;
            existing.UpdatedAt = DateTime.UtcNow.ToString("o");

            await _userRepository.UpdateAsync(existing);
            var updatedUser = existing;
            var response = new UserDTO
            {
                Id = updatedUser.Id,
                Username = updatedUser.Username,
                Email = updatedUser.Email,
                Role = updatedUser.Role,
                AvatarUrl = updatedUser.AvatarUrl,
            };

            return Ok(response);
        }

        // DELETE api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var existing = await _userRepository.GetByIdAsync(id);
            if (existing is null)
                return NotFound();

            await _userRepository.DeleteAsync(id);

            return NoContent();
        }
    }
}
