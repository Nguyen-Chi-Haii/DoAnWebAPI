using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Like;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/images/{imageId}/like")]
    public class LikesController : ControllerBase
    {
        private readonly ILikeRepository _likeRepository;

        public LikesController(ILikeRepository likeRepository)
        {
            _likeRepository = likeRepository;
        }

        // Helper to map Domain model to DTO
        private LikeDTO MapToDTO(Like like)
        {
            return new LikeDTO
            {
                Id = like.Id,
                UserId = like.UserId,
                ImageId = like.ImageId
            };
        }

        // GET /api/images/{imageId}/likes
        [HttpGet("/api/images/{imageId}/likes")]
        public async Task<ActionResult<IEnumerable<LikeDTO>>> GetLikesByImage(int imageId)
        {
            var likes = await _likeRepository.GetLikesByImageIdAsync(imageId);
            var dtos = likes.Select(MapToDTO).ToList();
            return Ok(dtos);
        }

        // POST /api/images/{imageId}/like
        [HttpPost]
        public async Task<ActionResult<LikeDTO>> PostLike(int imageId, [FromBody] CreateLikeDTO dto)
        {
            // Sanity check
            if (imageId != dto.ImageId)
            {
                return BadRequest("ImageId in route must match ImageId in body.");
            }

            // Check if like already exists (unique constraint on ImageId + UserId)
            var existingLike = await _likeRepository.GetLikeByImageAndUserAsync(imageId, dto.UserId);
            if (existingLike != null)
            {
                return Conflict("User has already liked this image.");
            }

            var createdLike = await _likeRepository.CreateLikeAsync(dto);
            var responseDto = MapToDTO(createdLike);
            return Created(string.Empty, responseDto); // Returns 201
        }

        // DELETE /api/images/{imageId}/like?userId={userId}
        [HttpDelete]
        public async Task<IActionResult> DeleteLike(int imageId, [FromQuery] int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("Invalid or missing userId query parameter.");
            }

            var removed = await _likeRepository.DeleteLikeAsync(imageId, userId);
            if (!removed)
            {
                return NotFound("Like association not found.");
            }
            return NoContent();
        }
    }
}