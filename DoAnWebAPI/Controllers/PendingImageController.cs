using DoAnWebAPI.Model.Domain;
using DoAnWebAPI.Model.DTO.PendingImage;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    public class PendingImageController : ControllerBase
    {
        private readonly IPendingImageRepository _repository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly FirebaseService _firebaseService;

        public PendingImageController(
            IPendingImageRepository repository,
            ICloudinaryService cloudinaryService,
            FirebaseService firebaseService)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
            _firebaseService = firebaseService;
        }

        // GET /api/pending-images
        [HttpGet]
        public async Task<ActionResult<List<PendingImageDTO>>> GetAll()
        {
            var userId = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId) || !await _firebaseService.IsAdminAsync(userId))
            {
                return Unauthorized("Only administrators have access.");
            }

            var images = await _repository.GetAllAsync();
            var dtos = images.Select(i => new PendingImageDTO
            {
                Id = i.Id,
                UserId = i.UserId,
                Title = i.Title,
                ThumbnailUrl = i.ThumbnailUrl,
                Status = i.Status
            }).ToList();
            return Ok(dtos);
        }

        // GET /api/pending-images/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PendingImageDTO>> GetById(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid image ID.");
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId) || !await _firebaseService.IsAdminAsync(userId))
            {
                return Unauthorized("Only administrators have access.");
            }

            var image = await _repository.GetByIdAsync(id);
            if (image == null)
            {
                return NotFound("No images found.");
            }

            var dto = new PendingImageDTO
            {
                Id = image.Id,
                UserId = image.UserId,
                Title = image.Title,
                ThumbnailUrl = image.ThumbnailUrl,
                Status = image.Status
            };
            return Ok(dto);
        }

        // POST /api/pending-images
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<PendingImageDTO>> Create([FromForm] CreatePendingImageDTO dto)
        {
            // Kiểm tra tính hợp lệ của DTO qua Data Annotations
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra định dạng tệp
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(dto.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest("Only supports JPG, JPEG, PNG, and GIF formats.");
            }

            // Tải tệp lên Cloudinary
            var (fileUrl, thumbnailUrl, size, width, height) = await _cloudinaryService.UploadImageAsync(dto.File);
            if (string.IsNullOrEmpty(fileUrl))
            {
                return BadRequest("Failed to load image.");
            }

            var newImage = new PendingImage
            {
                Id = 0,
                UserId = dto.UserId,
                Title = dto.Title,
                Description = dto.Description,
                FileUrl = fileUrl,
                ThumbnailUrl = thumbnailUrl,
                SizeBytes = size,
                Width = width,
                Height = height,
                SubmittedAt = DateTime.UtcNow,
                ReviewedAt = null,
                Status = "pending"
            };

            var created = await _repository.CreateAsync(newImage);
            if (created == null)
            {
                return BadRequest("Creating image pending approval failed.");
            }

            var responseDto = new PendingImageDTO
            {
                Id = created.Id,
                UserId = created.UserId,
                Title = created.Title,
                ThumbnailUrl = created.ThumbnailUrl,
                Status = created.Status
            };
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, responseDto);
        }

        // PUT /api/pending-images/{id}/approve
        [HttpPut("{id}/approve")]
        public async Task<ActionResult<PendingImageDTO>> Approve(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid image ID.");
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId) || !await _firebaseService.IsAdminAsync(userId))
            {
                return Unauthorized("Only administrators have the right to approve images.");
            }

            var updateDto = new UpdatePendingImageDTO
            {
                Status = "approved",
                ReviewedAt = DateTime.UtcNow
            };
            return await UpdateStatus(id, updateDto);
        }

        // PUT /api/pending-images/{id}/reject
        [HttpPut("{id}/reject")]
        public async Task<ActionResult<PendingImageDTO>> Reject(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid image ID.");
            }

            var userId = User.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId) || !await _firebaseService.IsAdminAsync(userId))
            {
                return Unauthorized("Only administrators have the right to reject images.");
            }

            var updateDto = new UpdatePendingImageDTO
            {
                Status = "rejected",
                ReviewedAt = DateTime.UtcNow
            };
            return await UpdateStatus(id, updateDto);
        }

        private async Task<ActionResult<PendingImageDTO>> UpdateStatus(int id, UpdatePendingImageDTO updateDto)
        {
            if (updateDto.Status != "approved" && updateDto.Status != "rejected")
            {
                return BadRequest("Invalid status, only 'approved' or 'rejected' are allowed.");
            }

            var updated = await _repository.UpdateStatusAsync(id, updateDto.Status, updateDto.ReviewedAt);
            if (updated == null)
            {
                return NotFound("No images found.");
            }

            var responseDto = new PendingImageDTO
            {
                Id = updated.Id,
                UserId = updated.UserId,
                Title = updated.Title,
                ThumbnailUrl = updated.ThumbnailUrl,
                Status = updated.Status
            };
            return Ok(responseDto);
        }
    }
}
