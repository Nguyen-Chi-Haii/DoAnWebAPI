using DoAnWebAPI.Model;
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
        public async Task<ActionResult<List<ImageTopic>>> GetTopics(int imageId)
        {
            var topics = await _repository.GetTopicsByImageIdAsync(imageId);
            return Ok(topics);
        }
        [HttpPost("{imageId}/topics/{topicId}")]
        public async Task<ActionResult<ImageTopic>> AddTopic(int imageId, int topicId)
        {
            var added = await _repository.AddTopicToImageAsync(imageId, topicId);
            if (added == null)
            {
                return Conflict("Association already exists.");
            }
            return CreatedAtAction(nameof(GetTopics), new { imageId }, added);
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
