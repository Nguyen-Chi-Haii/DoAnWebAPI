using DoAnWebAPI.Model.DTO.PendingImage;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PendingImageController : ControllerBase
    {
        private readonly IPendingImageRepository _repository;

        public PendingImageController(IPendingImageRepository repository)
        {
            _repository = repository;
        }

        // GET /api/pending-images
        [HttpGet]
        public async Task<ActionResult<List<PendingImageDTO>>> GetAll()
        {
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
            var image = await _repository.GetByIdAsync(id);
            if (image == null)
            {
                return NotFound();
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
        public async Task<ActionResult<PendingImageDTO>> Create([FromBody] CreatePendingImageDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _repository.CreateAsync(dto);
            if (created == null)
            {
                return BadRequest("Failed to create pending image");
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
            var updateDto = new UpdatePendingImageDTO
            {
                Status = "rejected",
                ReviewedAt = DateTime.UtcNow
            };
            return await UpdateStatus(id, updateDto);
        }

        private async Task<ActionResult<PendingImageDTO>> UpdateStatus(int id, UpdatePendingImageDTO updateDto)
        {
            var updated = await _repository.UpdateStatusAsync(id, updateDto.Status, updateDto.ReviewedAt);
            if (updated == null)
            {
                return NotFound();
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
