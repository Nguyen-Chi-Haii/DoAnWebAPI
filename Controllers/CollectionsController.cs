using DoAnWebAPI.Model.DTO.Collection;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization; // Thêm
using System.Security.Claims; // Thêm
using System; // Thêm cho UnauthorizedAccessException

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // api/collections
    [Authorize] // 🔐 Yêu cầu tất cả các action phải được xác thực theo mặc định
    public class CollectionsController : ControllerBase
    {
        private readonly ICollectionRepository _collectionRepository;
        private readonly ICollectionImageRepository _collectionImageRepository;
        private readonly IImageRepository _imageRepository;

        public CollectionsController(ICollectionRepository collectionRepository, ICollectionImageRepository collectionImageRepository, IImageRepository imageRepository)
        {
            _collectionRepository = collectionRepository;
            _collectionImageRepository = collectionImageRepository;
            _imageRepository = imageRepository;
        }

        // Helper để lấy ID người dùng đã xác thực (từ Claims)
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }

        // Helper to map Domain model to DTO
        private async Task<CollectionDTO> MapToDTO(Model.Collection collection)
        {
            var imageLinks = await _collectionImageRepository.GetImagesByCollectionIdAsync(collection.Id);
            var imageDtos = new List<Model.DTO.Image.ImageDTO>();

            // WARNING: Inefficient. This retrieves every image one by one. Optimize in a production environment.
            foreach (var link in imageLinks)
            {
                var imageDto = await _imageRepository.GetByIdAsync(link.ImageId.ToString());
                if (imageDto != null)
                {
                    imageDtos.Add(imageDto);
                }
            }

            return new CollectionDTO
            {
                Id = collection.Id,
                UserId = collection.UserId,
                Name = collection.Name,
                IsPublic = collection.IsPublic,
                Images = imageDtos
            };
        }

        // GET /api/collections
        [HttpGet]
        [AllowAnonymous] // Cho phép người dùng chưa đăng nhập xem
        public async Task<ActionResult<IEnumerable<CollectionDTO>>> GetAll()
        {
            var currentUserId = 0; // Mặc định là 0 (guest)
            if (User.Identity.IsAuthenticated)
            {
                try
                {
                    currentUserId = GetCurrentUserId();
                }
                catch (UnauthorizedAccessException) { /* Coi như là guest nếu có lỗi parsing */ }
            }

            var collections = await _collectionRepository.GetAllAsync();
            var dtos = new List<CollectionDTO>();

            foreach (var collection in collections)
            {
                // Chỉ trả về public collections HOẶC collections của chính người dùng hiện tại
                if (collection.IsPublic || collection.UserId == currentUserId)
                {
                    dtos.Add(await MapToDTO(collection));
                }
            }
            return Ok(dtos);
        }

        // GET /api/collections/{id}
        [HttpGet("{id}")]
        [AllowAnonymous] // Cho phép người dùng chưa đăng nhập xem public collections
        public async Task<ActionResult<CollectionDTO>> GetById(int id)
        {
            var collection = await _collectionRepository.GetByIdAsync(id);
            if (collection == null) return NotFound();

            var currentUserId = 0;
            if (User.Identity.IsAuthenticated)
            {
                try
                {
                    currentUserId = GetCurrentUserId();
                }
                catch (UnauthorizedAccessException) { /* Coi như là guest */ }
            }

            // Kiểm tra quyền truy cập: Nếu không Public VÀ không phải chủ sở hữu -> Forbidden
            if (!collection.IsPublic && collection.UserId != currentUserId)
            {
                return Forbid("Bạn không có quyền xem bộ sưu tập private này."); // 403 Forbidden
            }

            var dto = await MapToDTO(collection);
            return Ok(dto);
        }

        // POST /api/collections
        [HttpPost]
        // 🔐 Yêu cầu đăng nhập (sử dụng [Authorize] ở cấp Controller)
        public async Task<ActionResult<CollectionDTO>> Create(CreateCollectionDTO dto)
        {
            // ✅ Data Validation: Tự động kiểm tra [Required], [MaxLength] từ DTO
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int currentUserId;
            try
            {
                currentUserId = GetCurrentUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message); // 401 Unauthorized (Dù đã có [Authorize] nhưng thêm vào để an toàn)
            }

            // 🔑 Phân quyền: Tạo Domain Model và gán UserId từ người dùng đã xác thực
            var collectionToCreate = new Model.Collection
            {
                UserId = currentUserId, // 🔑 OVERRIDE: Chỉ dùng ID từ Claims
                Name = dto.Name,
                Description = dto.Description,
                IsPublic = dto.IsPublic
            };

            // Gọi Repository với Domain Model và ImageIds
            var createdCollection = await _collectionRepository.CreateAsync(collectionToCreate, dto.ImageIds);
            var responseDto = await MapToDTO(createdCollection);

            return CreatedAtAction(nameof(GetById), new { id = responseDto.Id }, responseDto);
        }

        // PUT /api/collections/{id}
        [HttpPut("{id}")]
        // 🔐 Yêu cầu đăng nhập
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCollectionDTO dto)
        {
            // ✅ Data Validation
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int currentUserId;
            try
            {
                currentUserId = GetCurrentUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            var existingCollection = await _collectionRepository.GetByIdAsync(id);
            if (existingCollection == null) return NotFound();

            // 🔑 Phân quyền: Kiểm tra quyền sở hữu
            if (existingCollection.UserId != currentUserId)
            {
                return Forbid("Bạn chỉ có thể chỉnh sửa bộ sưu tập của chính mình."); // 403 Forbidden
            }

            var result = await _collectionRepository.UpdateAsync(id, dto);
            if (result == null) return NotFound(); // Should not happen if pre-check passed
            return NoContent();
        }

        // DELETE /api/collections/{id}
        [HttpDelete("{id}")]
        // 🔐 Yêu cầu đăng nhập
        public async Task<IActionResult> Delete(int id)
        {
            int currentUserId;
            try
            {
                currentUserId = GetCurrentUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            var existingCollection = await _collectionRepository.GetByIdAsync(id);
            if (existingCollection == null) return NotFound();

            // 🔑 Phân quyền: Kiểm tra quyền sở hữu
            if (existingCollection.UserId != currentUserId)
            {
                return Forbid("Bạn chỉ có thể xóa bộ sưu tập của chính mình."); // 403 Forbidden
            }

            var result = await _collectionRepository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}