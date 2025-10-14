using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.CollectionImage;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using DoAnWebAPI.Services;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/collections/{collectionId}/images")]
    [Authorize(Policy = "UserOrAdmin")]
    public class CollectionImagesController : ControllerBase
    {
        private readonly ICollectionImageRepository _collectionImageRepository;
        private readonly ICollectionRepository _collectionRepository;
        private readonly IImageRepository _imageRepository;
        private readonly FirebaseService _firebaseService;

        public CollectionImagesController(
       ICollectionImageRepository collectionImageRepository,
       ICollectionRepository collectionRepository,
       IImageRepository imageRepository,
       FirebaseService firebaseService)
        {
            _collectionImageRepository = collectionImageRepository;
            _collectionRepository = collectionRepository;
            _imageRepository = imageRepository;
            _firebaseService = firebaseService;
        }

        [HttpGet]
        public async Task<ActionResult<List<CollectionImageDto>>> GetImages(int collectionId)
        {
            try
            {
                if (collectionId <= 0)
                {
                    return BadRequest("Collection ID must be a positive integer.");
                }

                var collection = await _collectionRepository.GetByIdAsync(collectionId);
                if (collection == null)
                {
                    return NotFound("Collection not found.");
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var isAdmin = await _firebaseService.IsAdminAsync(userId);
                if (!isAdmin && collection.UserId.ToString() != userId)
                {
                    return Forbid("You are not authorized to view this collection's images.");
                }

                var collectionImages = await _collectionImageRepository.GetImagesByCollectionIdAsync(collectionId);
                var dtos = collectionImages.Select(ci => new CollectionImageDto
                {
                    ImageId = ci.ImageId,
                    AddedAt = ci.AddedAt
                }).ToList();

                foreach (var dto in dtos)
                {
                    var validationContext = new ValidationContext(dto);
                    Validator.ValidateObject(dto, validationContext, validateAllProperties: true);
                }

                return Ok(dtos);
            }
            catch (ValidationException ex)
            {
                return BadRequest($"Validation error: {ex.Message}");
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
                if (collectionId <= 0 || imageId <= 0)
                {
                    return BadRequest("Collection ID and Image ID must be positive integers.");
                }

                var collection = await _collectionRepository.GetByIdAsync(collectionId);
                if (collection == null)
                {
                    return NotFound("Collection not found.");
                }

                var image = await _imageRepository.GetByIdAsync(imageId.ToString()); // Sửa: Chuyển int imageId thành string
                if (image == null)
                {
                    return NotFound("Image not found.");
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var isAdmin = await _firebaseService.IsAdminAsync(userId);
                if (!isAdmin && collection.UserId.ToString() != userId)
                {
                    return Forbid("You are not authorized to add images to this collection.");
                }

                var result = await _collectionImageRepository.AddImageToCollectionAsync(collectionId, imageId);
                if (result == null)
                {
                    return BadRequest("Image already exists in this collection or invalid input.");
                }

                var responseDto = new CollectionImageDto
                {
                    ImageId = result.ImageId,
                    AddedAt = result.AddedAt
                };

                var validationContext = new ValidationContext(responseDto);
                Validator.ValidateObject(responseDto, validationContext, validateAllProperties: true);

                return CreatedAtAction(
                    nameof(GetImages),
                    new { collectionId },
                    responseDto);
            }
            catch (ValidationException ex)
            {
                return BadRequest($"Validation error: {ex.Message}");
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
                if (collectionId <= 0 || imageId <= 0)
                {
                    return BadRequest("Collection ID and Image ID must be positive integers.");
                }

                var collection = await _collectionRepository.GetByIdAsync(collectionId);
                if (collection == null)
                {
                    return NotFound("Collection not found.");
                }

                var image = await _imageRepository.GetByIdAsync(imageId.ToString()); // Sửa: Chuyển int imageId thành string
                if (image == null)
                {
                    return NotFound("Image not found.");
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var isAdmin = await _firebaseService.IsAdminAsync(userId);
                if (!isAdmin && collection.UserId.ToString() != userId)
                {
                    return Forbid("You are not authorized to remove images from this collection.");
                }

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