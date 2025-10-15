// File: Controllers/ImagesController.cs

using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IImageRepository _repository;
        private readonly ICloudinaryService _cloudinaryService;

        public ImagesController(IImageRepository repository, ICloudinaryService cloudinaryService)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
        }

        private int? GetCurrentUserIdOrDefault()
        {
            var userIdClaim = User.FindFirst("local_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }

        private bool IsAdmin() => User.IsInRole("Admin");

        // GET /api/images
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ImageDTO>>> GetAll(
            [FromQuery] string? search = null,
            [FromQuery] int? tagId = null,
            [FromQuery] int? topicId = null,
            [FromQuery] int? userId = null)
        {
            var currentUserId = GetCurrentUserIdOrDefault();
            var allImages = await _repository.GetAllAsync(currentUserId);

            // Logic lọc dữ liệu vẫn giữ nguyên
            var accessibleImages = allImages.Where(image =>
                image.IsPublic || (image.UserId == currentUserId && currentUserId.HasValue) || IsAdmin()
            );

            if (!string.IsNullOrWhiteSpace(search))
            {
                accessibleImages = accessibleImages.Where(i =>
                    (i.Title != null && i.Title.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                    (i.Description != null && i.Description.Contains(search, StringComparison.OrdinalIgnoreCase))
                );
            }
            if (tagId.HasValue)
            {
                accessibleImages = accessibleImages.Where(i => i.Tags.Any(t => t.Id == tagId.Value));
            }
            if (topicId.HasValue)
            {
                accessibleImages = accessibleImages.Where(i => i.Topics.Any(t => t.Id == topicId.Value));
            }
            if (userId.HasValue)
            {
                accessibleImages = accessibleImages.Where(i => i.UserId == userId.Value);
            }

            return Ok(accessibleImages.ToList());
        }

        // GET /api/images/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ImageDTO>> GetById(string id)
        {
            var currentUserId = GetCurrentUserIdOrDefault();
            var image = await _repository.GetByIdAsync(id, currentUserId);

            if (image == null) return NotFound();

            if (!image.IsPublic && image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            return Ok(image);
        }

        // POST /api/images
        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(52428800)]
        public async Task<ActionResult<ImageDTO>> Create([FromForm] CreateImageDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var currentUserId = GetCurrentUserIdOrDefault();
            if (!currentUserId.HasValue) return Unauthorized("Không thể xác định người dùng.");

            var uploadResult = await _cloudinaryService.UploadImageAsync(dto.File);

            var created = await _repository.CreateAsync(
                currentUserId.Value,
                dto.Title,
                dto.Description,
                dto.IsPublic,
                dto.TagIds ?? new List<int>(),
                dto.TopicIds ?? new List<int>(),
                uploadResult.fileUrl,
                uploadResult.thumbnailUrl,
                uploadResult.size,
                uploadResult.width,
                uploadResult.height
            );

            return CreatedAtAction(nameof(GetById), new { id = created.Id.ToString() }, created);
        }

        // PUT /api/images/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateImageDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var currentUserId = GetCurrentUserIdOrDefault();
            if (!currentUserId.HasValue) return Unauthorized();

            var image = await _repository.GetByIdAsync(id); // Lấy bản gốc để kiểm tra quyền
            if (image == null) return NotFound();

            if (image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            var success = await _repository.UpdateAsync(id, dto);
            if (!success) return NotFound();

            return NoContent();
        }

        // DELETE /api/images/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            var currentUserId = GetCurrentUserIdOrDefault();
            if (!currentUserId.HasValue) return Unauthorized();

            var image = await _repository.GetByIdAsync(id);
            if (image == null) return NotFound();

            if (image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            var success = await _repository.DeleteAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }
    }
}