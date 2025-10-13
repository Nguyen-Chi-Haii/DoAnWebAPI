using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.ImageTopic;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/images/{imageId}/topics")]
    public class ImageTopicController : ControllerBase
    {
        private readonly IImageTopicRepository _repository;
        private readonly FirebaseService _firebaseService;

        public ImageTopicController(IImageTopicRepository repository, FirebaseService firebaseService)
        {
            _repository = repository;
            _firebaseService = firebaseService;
        }

        [HttpGet]
        [Authorize(Policy = "UserOrAdmin")]
        public async Task<ActionResult<List<ImageTopicDTO>>> GetTopics(int imageId)
        {
            // Validate imageId
            if (imageId <= 0)
            {
                return BadRequest("Invalid image ID.");
            }

            try
            {
                var topics = await _repository.GetTopicsByImageIdAsync(imageId);
                if (topics == null || !topics.Any())
                {
                    return NotFound("No topics found for the specified image.");
                }

                var dtos = topics.Select(t => new ImageTopicDTO
                {
                    ImageId = t.ImageId,
                    TopicId = t.TopicId,
                    CreatedAt = t.CreatedAt
                }).ToList();

                // Optional: Validate DTOs (though unlikely to fail since we're mapping from valid data)
                foreach (var dto in dtos)
                {
                    if (!TryValidateModel(dto))
                    {
                        return BadRequest(ModelState);
                    }
                }

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ImageTopicDTO>> AddTopic(int imageId, [FromBody] UpdateImageTopicDTO request)
        {
            // Validate model state
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate route and body consistency
            if (imageId != request.ImageId)
            {
                return BadRequest("Image ID in route and body must match.");
            }

            try
            {
                var added = await _repository.AddTopicToImageAsync(request.ImageId, request.TopicId);
                if (added == null)
                {
                    return Conflict("Topic already associated with this image.");
                }

                var dto = new ImageTopicDTO
                {
                    ImageId = added.ImageId,
                    TopicId = added.TopicId,
                    CreatedAt = added.CreatedAt
                };

                // Validate DTO before returning
                if (!TryValidateModel(dto))
                {
                    return BadRequest(ModelState);
                }

                return CreatedAtAction(nameof(GetTopics), new { imageId }, dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{topicId}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> RemoveTopic(int imageId, int topicId)
        {
            // Validate input
            if (imageId <= 0 || topicId <= 0)
            {
                return BadRequest("Invalid image ID or topic ID.");
            }

            try
            {
                var removed = await _repository.RemoveTopicFromImageAsync(imageId, topicId);
                if (!removed)
                {
                    return NotFound("Topic association not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
