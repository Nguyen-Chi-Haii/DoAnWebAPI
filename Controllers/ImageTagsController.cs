using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.ImageTag;
using DoAnWebAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageTagsController : ControllerBase
    {
        private readonly IImageTagRepository _repository;

        public ImageTagsController(IImageTagRepository repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Lấy tất cả các quan hệ ảnh - tag.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _repository.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách tag theo ảnh.
        /// </summary>
        [HttpGet("image/{imageId}")]
        public async Task<IActionResult> GetByImageId(int imageId)
        {
            var result = await _repository.GetByImageIdAsync(imageId);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách ảnh theo tag.
        /// </summary>
        [HttpGet("tag/{tagId}")]
        public async Task<IActionResult> GetByTagId(int tagId)
        {
            var result = await _repository.GetByTagIdAsync(tagId);
            return Ok(result);
        }

        /// <summary>
        /// Thêm mối quan hệ ảnh - tag.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] UpdateImageTagDTO dto)
        {
            if (dto == null) return BadRequest("Invalid request.");

            var imageTag = new ImageTag
            {
                ImageId = dto.ImageId,
                TagId = dto.TagId
            };

            var success = await _repository.AddAsync(imageTag);
            if (!success)
                return Conflict("This image-tag relationship already exists.");

            return Ok(new { message = "Added successfully." });
        }

        /// <summary>
        /// Xóa mối quan hệ ảnh - tag.
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> Delete([FromBody] UpdateImageTagDTO dto)
        {
            if (dto == null) return BadRequest("Invalid request.");

            var success = await _repository.DeleteAsync(dto.ImageId, dto.TagId);
            if (!success)
                return NotFound("Relationship not found.");

            return Ok(new { message = "Deleted successfully." });
        }
    }
}
