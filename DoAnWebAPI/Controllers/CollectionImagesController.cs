using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.CollectionImage;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using DoAnWebAPI.Services;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/collections/{collectionId}/images")]
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

        // 🧩 Phương thức dùng chung để lấy thông tin user
        private async Task<(int userId, bool isAdmin)> GetUserContextAsync()
        {
            var userIdClaim = User.FindFirst("local_id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Missing or invalid local_id in token.");

            var isAdmin = await _firebaseService.IsAdminAsync(userIdClaim);
            return (userId, isAdmin);
        }


        // 📸 GET: Lấy danh sách ảnh trong collection
        [HttpGet]
        public async Task<ActionResult<List<CollectionImageDto>>> GetImages(int collectionId)
        {
            try
            {
                var (userId, isAdmin) = await GetUserContextAsync();

                var collection = await _collectionRepository.GetByIdAsync(collectionId);
                if (collection == null)
                {
                    return NotFound("Collection not found.");
                }

                if (!isAdmin && collection.UserId != userId)
                {
                    return Forbid("You are not authorized to view this collection's images.");
                }


                var collectionImages = await _collectionImageRepository.GetImagesByCollectionIdAsync(collectionId);

                var dtos = collectionImages.Select(ci => new CollectionImageDto
                {
                    ImageId = ci.ImageId,
                    AddedAt = ci.AddedAt
                }).ToList();

                // Xác thực dữ liệu DTO
                foreach (var dto in dtos)
                {
                    Validator.ValidateObject(dto, new ValidationContext(dto), validateAllProperties: true);
                }

                return Ok(dtos);
            }
            catch (ValidationException ex)
            {
                return BadRequest($"Validation error: {ex.Message}");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // ➕ POST: Thêm ảnh vào collection
        [HttpPost("{imageId}")]
        public async Task<ActionResult> AddImage(int collectionId, int imageId)
        {
            try
            {
                var (userId, isAdmin) = await GetUserContextAsync();

                var collection = await _collectionRepository.GetByIdAsync(collectionId);
                if (collection == null)
                    return NotFound("Collection not found.");

                if (!isAdmin && collection.UserId != userId)
                    return Forbid("You are not authorized to add images to this collection.");

                var image = await _imageRepository.GetByIdAsync(imageId.ToString());
                if (image == null)
                    return NotFound("Image not found.");

                var result = await _collectionImageRepository.AddImageToCollectionAsync(collectionId, imageId);
                if (result == null)
                    return BadRequest("Image already exists in this collection or invalid input.");

                var dto = new CollectionImageDto
                {
                    ImageId = result.ImageId,
                    AddedAt = result.AddedAt
                };

                Validator.ValidateObject(dto, new ValidationContext(dto), validateAllProperties: true);

                return CreatedAtAction(nameof(GetImages), new { collectionId }, dto);
            }
            catch (ValidationException ex)
            {
                return BadRequest($"Validation error: {ex.Message}");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // ❌ DELETE: Xóa ảnh khỏi collection
        [HttpDelete("{imageId}")]
        public async Task<ActionResult> RemoveImage(int collectionId, int imageId)
        {
            try
            {
                var (userId, isAdmin) = await GetUserContextAsync();

                var collection = await _collectionRepository.GetByIdAsync(collectionId);
                if (collection == null)
                    return NotFound("Collection not found.");

                if (!isAdmin && collection.UserId != userId)
                    return Forbid("You are not authorized to remove images from this collection.");

                var image = await _imageRepository.GetByIdAsync(imageId.ToString());
                if (image == null)
                    return NotFound("Image not found.");

                var success = await _collectionImageRepository.RemoveImageFromCollectionAsync(collectionId, imageId);
                if (!success)
                    return NotFound("Image not found in this collection.");

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
