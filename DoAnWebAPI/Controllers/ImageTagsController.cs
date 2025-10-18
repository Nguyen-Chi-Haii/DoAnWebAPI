using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.ImageTag;
using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageTagsController : ControllerBase
    {
        private readonly IImageTagRepository _imageTagRepository;
        private readonly IImageRepository _imageRepository;
        private readonly ITagRepository _tagRepository;

        public ImageTagsController(
     IImageTagRepository imageTagRepository,
     IImageRepository imageRepository,
     ITagRepository tagRepository)
        {
            _imageTagRepository = imageTagRepository;
            _imageRepository = imageRepository;
            _tagRepository = tagRepository;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            var result = await _imageTagRepository.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("image/{imageId}")]
        [Authorize]
        public async Task<IActionResult> GetByImageId(int imageId)
        {
            if (imageId <= 0)
                return BadRequest("Image ID must be a positive integer.");

            var image = await _imageRepository.GetByIdAsync(imageId.ToString()); // Sửa: Chuyển int imageId thành string
            if (image == null)
                return NotFound("Image not found.");

            var result = await _imageTagRepository.GetByImageIdAsync(imageId);
            return Ok(result);
        }

        [HttpGet("tag/{tagId}")]
        [Authorize]
        public async Task<IActionResult> GetByTagId(int tagId)
        {
            if (tagId <= 0)
                return BadRequest("Tag ID must be a positive integer.");

            var tag = await _tagRepository.GetByIdAsync(tagId); // Đã đúng vì TagRepository dùng int
            if (tag == null)
                return NotFound("Tag not found.");

            var result = await _imageTagRepository.GetByTagIdAsync(tagId);
            return Ok(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Add([FromBody] UpdateImageTagDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var image = await _imageRepository.GetByIdAsync(dto.ImageId.ToString()); // Sửa: Chuyển int ImageId thành string
            if (image == null)
                return NotFound("Image not found.");

            var tag = await _tagRepository.GetByIdAsync(dto.TagId); // Đã đúng vì TagRepository dùng int
            if (tag == null)
                return NotFound("Tag not found.");

            var imageTag = new ImageTag
            {
                ImageId = dto.ImageId,
                TagId = dto.TagId
            };

            var success = await _imageTagRepository.AddAsync(imageTag);
            if (!success)
                return Conflict("This image-tag relationship already exists.");

            return Ok(new { message = "Tag added to image successfully." });
        }

        [HttpDelete]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete([FromBody] UpdateImageTagDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var image = await _imageRepository.GetByIdAsync(dto.ImageId.ToString()); // Sửa: Chuyển int ImageId thành string
            if (image == null)
                return NotFound("Image not found.");

            var tag = await _tagRepository.GetByIdAsync(dto.TagId); // Đã đúng vì TagRepository dùng int
            if (tag == null)
                return NotFound("Tag not found.");

            var success = await _imageTagRepository.DeleteAsync(dto.ImageId, dto.TagId);
            if (!success)
                return NotFound("Image-tag relationship not found.");

            return Ok(new { message = "Tag removed from image successfully." });
        }
    }
}
