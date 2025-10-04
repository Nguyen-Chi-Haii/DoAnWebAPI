using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.ImageTopic;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageTopicController : ControllerBase
    {
        private readonly IImageTopicRepository _repository;
        public ImageTopicController(IImageTopicRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("{imageId}/topics")]
        public async Task<ActionResult<List<ImageTopicDTO>>> GetTopics(int imageId)
        {
            var topics = await _repository.GetTopicsByImageIdAsync(imageId);
            var dtos = topics.Select(t => new ImageTopicDTO
            {
                ImageId = t.ImageId,
                TopicId = t.TopicId,
                CreatedAt = t.CreatedAt
            }).ToList();
            return Ok(dtos);
        }

        [HttpPost("{imageId}/topics")]
        public async Task<ActionResult<ImageTopicDTO>> AddTopic(int imageId, [FromBody] UpdateImageTopicDTO request)
        {
            // Validate mismatch giữa route và body (giữ nguyên, không phải validation DTO)
            if (imageId != request.ImageId)
            {
                return BadRequest("ImageId in route and body mismatch.");
            }

            var added = await _repository.AddTopicToImageAsync(request.ImageId, request.TopicId);
            if (added == null)
            {
                return Conflict("Association already exists.");
            }

            // Map sang DTO để return
            var dto = new ImageTopicDTO
            {
                ImageId = added.ImageId,
                TopicId = added.TopicId,
                CreatedAt = added.CreatedAt
            };

            return CreatedAtAction(nameof(GetTopics), new { imageId }, dto);
        }

        [HttpDelete("{imageId}/topics/{topicId}")]
        public async Task<IActionResult> RemoveTopic(int imageId, int topicId)
        {
            var removed = await _repository.RemoveTopicFromImageAsync(imageId, topicId);
            if (!removed)
            {
                return NotFound("Association not found.");
            }
            return NoContent();
        }
    }
}
