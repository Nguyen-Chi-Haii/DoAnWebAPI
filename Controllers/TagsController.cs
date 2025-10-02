using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly ITagRepository _tagRepository;

        public TagsController(ITagRepository tagRepository)
        {
            _tagRepository = tagRepository;
        }

        // GET: api/tags
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tags = await _tagRepository.GetAllAsync();
            return Ok(tags);
        }

        // POST: api/tags
        [HttpPost]
        public async Task<IActionResult> Create(CreateTagDTO dto)
        {
            var tag = await _tagRepository.CreateAsync(dto);
            return Ok(tag);
        }

        // PUT: api/tags/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateTagDTO dto)
        {
            var result = await _tagRepository.UpdateAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        // DELETE: api/tags/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _tagRepository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
