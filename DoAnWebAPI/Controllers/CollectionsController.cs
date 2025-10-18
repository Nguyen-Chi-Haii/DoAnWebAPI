using DoAnWebAPI.Model.DTO.Collection;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Authorization; // Thêm
using Microsoft.AspNetCore.Mvc;
using System; // Thêm cho UnauthorizedAccessException
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims; // Thêm
using System.Threading.Tasks;

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
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("local_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
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
                    currentUserId = (int)GetCurrentUserId();
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

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CollectionDTO>> GetById(int id)
        {
            var collection = await _collectionRepository.GetByIdAsync(id);
            if (collection == null) return NotFound();

            var currentUserId = User.Identity.IsAuthenticated ? GetCurrentUserId() : 0;

            if (!collection.IsPublic && collection.UserId != currentUserId)
            {
                return Forbid("Bạn không có quyền xem bộ sưu tập private này.");
            }

            // ✅ BẮT ĐẦU SỬA LỖI TẠI ĐÂY
            // Bỏ qua hàm MapToDTO và xử lý trực tiếp để tối ưu và đúng dữ liệu

            // 1. Lấy danh sách các liên kết ảnh-bộ sưu tập
            var imageLinks = await _collectionImageRepository.GetImagesByCollectionIdAsync(collection.Id);
            var imageDtos = new List<Model.DTO.Image.ImageDTO>();

            // 2. Lấy thông tin chi tiết cho từng ảnh
            if (imageLinks.Any())
            {
                var imageTasks = imageLinks.Select(link => _imageRepository.GetByIdAsync(link.ImageId.ToString()));
                var images = (await Task.WhenAll(imageTasks)).Where(img => img != null);
                imageDtos.AddRange(images);
            }

            // 3. Tạo DTO trả về với dữ liệu chính xác
            return Ok(new CollectionDTO
            {
                Id = collection.Id,
                UserId = collection.UserId,
                Name = collection.Name,
                IsPublic = collection.IsPublic,
                Images = imageDtos, // Trả về danh sách đối tượng ảnh đầy đủ
                ImageCount = imageDtos.Count // Đếm số lượng ảnh chính xác
            });
            // ✅ KẾT THÚC SỬA LỖI
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
                currentUserId = (int)GetCurrentUserId();
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
                currentUserId = (int)GetCurrentUserId();
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
                currentUserId = (int)GetCurrentUserId();
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
        [HttpGet("/api/users/{userId}/collections")]
        [ProducesResponseType(typeof(List<CollectionDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCollectionsByUserId(int userId)
        {
            var collections = await _collectionRepository.GetByUserIdAsync(userId);

            if (collections == null || !collections.Any())
            {
                return Ok(new List<CollectionDTO>());
            }

            // Dùng Task.WhenAll để xử lý logic cho tất cả collection một cách song song
            var collectionDtoTasks = collections.Select(async collection =>
            {
                // Lấy danh sách ID ảnh trong collection
                var collectionImages = await _collectionImageRepository.GetImagesByCollectionIdAsync(collection.Id);

                string thumbnailUrl = "https://via.placeholder.com/300x200.png?text=No+Image"; // URL mặc định

                // Nếu có ảnh trong collection
                if (collectionImages.Any())
                {
                    // 3. Lấy ra ImageId từ đối tượng đầu tiên và chuyển thành chuỗi
                    var firstImageId = collectionImages.First().ImageId.ToString();

                    // 4. ✅ SỬA LỖI Ở ĐÂY: Dùng ID kiểu chuỗi để gọi GetByIdAsync
                    var firstImage = await _imageRepository.GetByIdAsync(firstImageId);
                    if (firstImage != null)
                    {
                        thumbnailUrl = firstImage.ThumbnailUrl;
                    }
                }

                return new CollectionDTO
                {
                    Id = collection.Id,
                    Name = collection.Name,
                    Description = collection.Description,
                    IsPublic = collection.IsPublic,
                    UserId = collection.UserId,
                    ImageCount = collectionImages.Count, // ✅ Đếm số ảnh
                    ThumbnailUrl = thumbnailUrl  // ✅ Lấy thumbnail
                };
            });

            var collectionDtos = await Task.WhenAll(collectionDtoTasks);

            return Ok(collectionDtos.ToList());
        }
    }
}