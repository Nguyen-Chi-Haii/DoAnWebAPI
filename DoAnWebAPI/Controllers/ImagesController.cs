// File: Controllers/ImagesController.cs

using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IImageRepository _repository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IStatRepository _statRepository;

        public ImagesController(IImageRepository repository, ICloudinaryService cloudinaryService, IStatRepository statRepository)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
            _statRepository = statRepository;
        }

        private int? GetCurrentUserIdOrDefault()
        {
            var userIdClaim = User.FindFirst("local_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }

        private bool IsAdmin() => User.IsInRole("Admin");

        [HttpGet]
        // Bỏ [Authorize] nếu bạn muốn trang chủ (public) cũng gọi được
        public async Task<ActionResult> GetAll(
             // === CÁC THAM SỐ CỦA BẠN ===
             [FromQuery] string? search = null,
             [FromQuery] int? tagId = null,
             [FromQuery] int? topicId = null,
             [FromQuery] int? userId = null,

             // === CÁC THAM SỐ MỚI BẠN VỪA YÊU CẦU ===
             [FromQuery] string? status = null, // (approved, pending, ...)
             [FromQuery] bool? isPublic = null, // (true, false)

             // === THAM SỐ PHÂN TRANG (RẤT QUAN TRỌNG) ===
             [FromQuery] int page = 1,
             [FromQuery] int pageSize = 10
         )
        {
            var currentUserId = GetCurrentUserIdOrDefault();
            var allImageDtos = await _repository.GetAllAsync(currentUserId);
            var query = allImageDtos.AsQueryable();

            // Lọc quyền truy cập cơ bản (vẫn cần thiết)
            query = query.Where(imageDto =>
                   imageDto.IsPublic || (imageDto.UserId == currentUserId && currentUserId.HasValue) || IsAdmin()
            );

            // Lọc theo các tham số (logic không đổi, áp dụng trên DTO)
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(i =>
                    (i.Title != null && i.Title.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                    (i.Description != null && i.Description.Contains(search, StringComparison.OrdinalIgnoreCase))
                );
            }
            if (tagId.HasValue)
            {
                // DTO có List<TagDTO> Tags
                query = query.Where(i => i.Tags != null && i.Tags.Any(t => t.Id == tagId.Value));
            }
            if (topicId.HasValue)
            {
                // DTO có List<TopicDTO> Topics
                query = query.Where(i => i.Topics != null && i.Topics.Any(t => t.Id == topicId.Value));
            }
            if (userId.HasValue)
            {
                query = query.Where(i => i.UserId == userId.Value);
            }
            if (isPublic.HasValue)
            {
                query = query.Where(i => i.IsPublic == isPublic.Value);
            }
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            // 3. SẮP XẾP (trên DTO)
            query = query.OrderByDescending(i => i.CreatedAt); // DTO đã có CreatedAt

            // 4. PHÂN TRANG (trên kết quả lọc cuối cùng)
            var totalCount = query.Count();
            var pagedItems = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList(); // .ToList() ở đây để thực thi query

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            // 5. TẠO KẾT QUẢ TRẢ VỀ (Đơn giản hơn vì pagedItems đã là List<ImageDTO>)
            var result = new
            {
                Items = pagedItems, // ✅ SỬA 3: Chỉ cần trả về pagedItems
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };

            return Ok(result);
        }

        // GET /api/images/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ImageDTO>> GetById(string id)
        {
            var currentUserId = GetCurrentUserIdOrDefault();
            var image = await _repository.GetByIdAsync(id, currentUserId);

            if (image == null) return NotFound();

            if (!image.IsPublic && image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            return Ok(image);
        }

        // POST /api/images
        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(52428800)]
        public async Task<ActionResult<ImageDTO>> Create([FromForm] CreateImageDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var currentUserId = GetCurrentUserIdOrDefault();
            if (!currentUserId.HasValue) return Unauthorized("Không thể xác định người dùng.");

            var uploadResult = await _cloudinaryService.UploadImageAsync(dto.File);

            var created = await _repository.CreateAsync(
                currentUserId.Value,
                dto.Title,
                dto.Description,
                dto.IsPublic,
                dto.TagIds ?? new List<int>(),
                dto.TopicIds ?? new List<int>(),
                uploadResult.fileUrl,
                uploadResult.thumbnailUrl,
                uploadResult.size,
                uploadResult.width,
                uploadResult.height
            );

            return CreatedAtAction(nameof(GetById), new { id = created.Id.ToString() }, created);
        }

        // PUT /api/images/{id}
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateImageDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var currentUserId = GetCurrentUserIdOrDefault();
            if (!currentUserId.HasValue) return Unauthorized();

            var image = await _repository.GetByIdAsync(id); // Lấy bản gốc để kiểm tra quyền
            if (image == null) return NotFound();

            if (image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            var success = await _repository.UpdateAsync(id, dto);
            if (!success) return NotFound();

            return NoContent();
        }

        // DELETE /api/images/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            var currentUserId = GetCurrentUserIdOrDefault();
            if (!currentUserId.HasValue) return Unauthorized();

            var image = await _repository.GetByIdAsync(id);
            if (image == null) return NotFound();

            if (image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            var success = await _repository.DeleteAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }
        // GET /api/images/{id}/download
        [HttpGet("{id}/download")]
        [AllowAnonymous] // Cho phép cả người dùng chưa đăng nhập, vì ta sẽ kiểm tra quyền bên trong
        public async Task<IActionResult> Download(string id)
        {
            // 1. Lấy thông tin người dùng hiện tại (nếu có)
            var currentUserId = GetCurrentUserIdOrDefault();

            // 2. Lấy thông tin chi tiết của ảnh từ repository
            // Dùng GetByIdAsync vì nó trả về DTO đầy đủ, bao gồm cả FileUrl
            var image = await _repository.GetByIdAsync(id, currentUserId);

            if (image == null)
            {
                return NotFound("Không tìm thấy ảnh.");
            }

            // 3. Kiểm tra quyền truy cập (giống hệt logic của GetById)
            if (!image.IsPublic && image.UserId != currentUserId && !IsAdmin())
            {
                // Trả về 403 Forbidden nếu không có quyền xem ảnh private
                return Forbid();
            }

            // 4. Tăng số lượt tải xuống
            try
            {
                await _statRepository.IncrementDownloadsAsync(image.Id);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi nếu cần, nhưng vẫn tiếp tục cho phép tải
                // logger.LogError(ex, "Lỗi khi tăng lượt tải xuống cho ảnh {ImageId}", image.Id);
            }

            // 5. Chuyển hướng người dùng đến URL của file trên Cloudinary
            // Trình duyệt sẽ tự động xử lý việc tải file xuống
            return Redirect(image.FileUrl);
        }
        [HttpGet("/api/users/{userId}/images")]
        public async Task<ActionResult<IEnumerable<ImageDTO>>> GetImagesByUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest("UserID không hợp lệ.");
            }

            // Gọi phương thức mới trong repository
            var userImages = await _repository.GetByUserIdAsync(userId);

            // Lọc để chỉ trả về các ảnh public nếu người xem không phải là chủ sở hữu hoặc admin
            var currentUserId = GetCurrentUserIdOrDefault();
            var accessibleImages = userImages.Where(image =>
                image.IsPublic || image.UserId == currentUserId || IsAdmin()
            );

            return Ok(accessibleImages.ToList());
        }
    }
}