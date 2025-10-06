using DoAnWebAPI.Model.DTO.CollectionImage;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/collections/{collectionId}/images")]
    public class CollectionImagesController : ControllerBase
    {
        private readonly ICollectionImageRepository _collectionImageRepository;

        public CollectionImagesController(ICollectionImageRepository collectionImageRepository)
        {
            _collectionImageRepository = collectionImageRepository;
        }

       
        [HttpGet]
        public async Task<ActionResult<List<CollectionImageDto>>> GetImages(int collectionId)
        {
            try
            {
                var collectionImages = await _collectionImageRepository.GetImagesByCollectionIdAsync(collectionId);
                var dtos = collectionImages.Select(ci => new CollectionImageDto
                {
                    ImageId = ci.ImageId,
                    AddedAt = ci.AddedAt
                }).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

       
        [HttpPost("{imageId}")]
        public async Task<ActionResult> AddImage(int collectionId, int imageId)
        {
            try
            {
                var result = await _collectionImageRepository.AddImageToCollectionAsync(collectionId, imageId);
                if (result == null)
                {
                    return BadRequest("Image already exists in this collection or invalid input.");
                }
                return CreatedAtAction(
                    nameof(GetImages),
                    new { collectionId },
                    new CollectionImageDto
                    {
                        ImageId = result.ImageId,
                        AddedAt = result.AddedAt
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

     
        [HttpDelete("{imageId}")]
        public async Task<ActionResult> RemoveImage(int collectionId, int imageId)
        {
            try
            {
                var success = await _collectionImageRepository.RemoveImageFromCollectionAsync(collectionId, imageId);
                if (!success)
                {
                    return NotFound("Image not found in this collection.");
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
