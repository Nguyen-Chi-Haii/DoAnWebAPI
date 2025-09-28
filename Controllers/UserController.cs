using FirebaseWebApi.Models;
using FirebaseWebApi.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FirebaseWebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly FirebaseService _firebaseService;

        public UsersController(FirebaseService firebaseService)
        {
            _firebaseService = firebaseService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            var createdUser = await _firebaseService.CreateUserAsync(user);
            return Created($"/api/users/{createdUser.Id}", createdUser);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _firebaseService.GetUserAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }
    }
}