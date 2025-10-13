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

        /// <summary>
        /// Get all image-tag relationships.
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "UserOrAdmin")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _imageTagRepository.GetAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Get tags for a specific image.
        /// </summary>
        [HttpGet("image/{imageId}")]
        [Authorize(Policy = "UserOrAdmin")]
        public async Task<IActionResult> GetByImageId(int imageId)
        {
            // Validate imageId
            if (imageId <= 0)
                return BadRequest("Image ID must be a positive integer.");

            // Check if image exists
            var image = await _imageRepository.GetByIdAsync(imageId);
            if (image == null)
                return NotFound("Image not found.");

            var result = await _imageTagRepository.GetByImageIdAsync(imageId);
            return Ok(result);
        }

        /// <summary>
        /// Get images for a specific tag.
        /// </summary>
        [HttpGet("tag/{tagId}")]
        [Authorize(Policy = "UserOrAdmin")]
        public async Task<IActionResult> GetByTagId(int tagId)
        {
            // Validate tagId
            if (tagId <= 0)
                return BadRequest("Tag ID must be a positive integer.");

            // Check if tag exists
            var tag = await _tagRepository.GetByIdAsync(tagId);
            if (tag == null)
                return NotFound("Tag not found.");

            var result = await _imageTagRepository.GetByTagIdAsync(tagId);
            return Ok(result);
        }

        /// <summary>
        /// Add an image-tag relationship.
        /// </summary>
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Add([FromBody] UpdateImageTagDTO dto)
        {
            // Validate DTO
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if image exists
            var image = await _imageRepository.GetByIdAsync(dto.ImageId);
            if (image == null)
                return NotFound("Image not found.");

            // Check if tag exists
            var tag = await _tagRepository.GetByIdAsync(dto.TagId);
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

        /// <summary>
        /// Delete an image-tag relationship.
        /// </summary>
        [HttpDelete]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete([FromBody] UpdateImageTagDTO dto)
        {
            // Validate DTO
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if image exists
            var image = await _imageRepository.GetByIdAsync(dto.ImageId);
            if (image == null)
                return NotFound("Image not found.");

            // Check if tag exists
            var tag = await _tagRepository.GetByIdAsync(dto.TagId);
            if (tag == null)
                return NotFound("Tag not found.");

            var success = await _imageTagRepository.DeleteAsync(dto.ImageId, dto.TagId);
            if (!success)
                return NotFound("Image-tag relationship not found.");

            return Ok(new { message = "Tag removed from image successfully." });
        }
    }
}
