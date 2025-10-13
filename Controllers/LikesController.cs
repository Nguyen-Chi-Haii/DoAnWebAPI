using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Like;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/images/{imageId}/like")]
    public class LikesController : ControllerBase
    {
        private readonly ILikeRepository _likeRepository;
        private readonly IStatRepository _statRepository;

        public LikesController(ILikeRepository likeRepository, IStatRepository statRepository)
        {
            _likeRepository = likeRepository;
            _statRepository = statRepository;
        }

        // Helper để lấy ID người dùng đã xác thực
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
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
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<LikeDTO>>> GetLikesByImage(int imageId)
        {
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }

            var likes = await _likeRepository.GetLikesByImageIdAsync(imageId);
            var dtos = likes.Select(MapToDTO).ToList();
            return Ok(dtos);
        }

        // POST /api/images/{imageId}/like
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<LikeDTO>> PostLike(int imageId, [FromBody] CreateLikeDTO dto)
        {
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }
            if (imageId != dto.ImageId)
            {
                return BadRequest("ImageId trong route phải khớp với ImageId trong body.");
            }

            int currentUserId;
            try
            {
                currentUserId = GetCurrentUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            var existingLike = await _likeRepository.GetLikeByImageAndUserAsync(imageId, currentUserId);
            if (existingLike != null)
            {
                // Hành động Like lặp lại => trả về 200/204 để client không cần làm gì thêm
                return NoContent();
            }

            var createdLike = await _likeRepository.CreateLikeAsync(currentUserId, imageId);

            // ✅ Cập nhật Stats: Tăng số Likes
            await _statRepository.IncrementLikesAsync(imageId);

            var responseDto = MapToDTO(createdLike);
            return Created(string.Empty, responseDto);
        }

        // DELETE /api/images/{imageId}/like
        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> DeleteLike(int imageId)
        {
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }

            int currentUserId;
            try
            {
                currentUserId = GetCurrentUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            var removed = await _likeRepository.DeleteLikeAsync(imageId, currentUserId);

            if (removed)
            {
                await _statRepository.DecrementLikesAsync(imageId);
                return NoContent();
            }

            return NotFound("Like association not found for this user and image. (User may not have liked it)");
        }
    }
}