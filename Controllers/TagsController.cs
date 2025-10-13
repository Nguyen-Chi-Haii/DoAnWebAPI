using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/tags
    [Authorize] // Mặc định yêu cầu xác thực
    public class TagsController : ControllerBase
    {
        private readonly ITagRepository _tagRepository;

        public TagsController(ITagRepository tagRepository)
        {
            _tagRepository = tagRepository;
        }

        // Helper để kiểm tra Admin (Giả định Role Claim tồn tại)
        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
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

            var result = await _tagRepository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}