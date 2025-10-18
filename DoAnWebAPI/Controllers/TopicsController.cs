using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController : ControllerBase
    {
        private readonly ITopicRepository _topicRepository;

        public TopicsController(ITopicRepository topicRepository)
        {
            _topicRepository = topicRepository;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<TopicDTO>>> GetAll()
        {
            var topics = await _topicRepository.GetAllAsync();
            var dtos = topics.Select(t => new TopicDTO { Id = t.Id, Name = t.Name }).ToList();
            return Ok(dtos);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<TopicDTO>> Create([FromBody] CreateTopicDTO createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _topicRepository.CreateAsync(createDto);
            var dto = new TopicDTO { Id = created.Id, Name = created.Name };
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, dto);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<TopicDTO>> Update(int id, [FromBody] UpdateTopicDTO updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _topicRepository.UpdateAsync(id, updateDto);
            if (updated == null) return NotFound();
            var dto = new TopicDTO { Id = updated.Id, Name = updated.Name };
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _topicRepository.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
