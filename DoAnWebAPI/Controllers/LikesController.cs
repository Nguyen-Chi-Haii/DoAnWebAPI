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

        // ✅ FIX LỖI 401: Lấy Local ID (integer) từ Custom Claim "local_id"
        private int? GetCurrentUserIdOrDefault()
        {
            var userIdClaim = User.FindFirst("local_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }

        // Helper to map Domain model to DTO
        private LikeDTO MapToDTO(Like like)
        {
            return new LikeDTO
            {
                // Giả định LikeDTO có các trường này
                // Id = like.Id, 
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

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<LikeDTO>> PostLike(int imageId)
        {
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }

            int currentUserId;
            try
            {
                currentUserId = (int)GetCurrentUserIdOrDefault();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            var existingLike = await _likeRepository.GetLikeByImageAndUserAsync(imageId, currentUserId);
            if (existingLike != null)
            {
                return NoContent();
            }

            var createdLike = await _likeRepository.CreateLikeAsync(currentUserId, imageId);

            // ✅ Cập nhật Stats
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
                currentUserId = (int)GetCurrentUserIdOrDefault();
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