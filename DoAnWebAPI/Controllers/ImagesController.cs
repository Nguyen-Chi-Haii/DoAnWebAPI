// File: Controllers/ImagesController.cs

using DoAnWebAPI.Model;
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using FirebaseWebApi.Repositories;
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
        private readonly IAdminLogRepository _adminLogRepository;
        private readonly IImageTagRepository _imageTagRepository;
        private readonly IImageTopicRepository _imageTopicRepository;

        public ImagesController(
            IImageRepository repository,
            ICloudinaryService cloudinaryService,
            IStatRepository statRepository,
            IAdminLogRepository adminLogRepository,
            IImageTagRepository imageTagRepository,
            IImageTopicRepository imageTopicRepository)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
            _statRepository = statRepository;
            _adminLogRepository = adminLogRepository;
            _imageTagRepository = imageTagRepository;      // <-- Gán
            _imageTopicRepository = imageTopicRepository;
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

             [FromQuery] string? date = null,
             // === THAM SỐ PHÂN TRANG (RẤT QUAN TRỌNG) ===
             [FromQuery] int page = 1,
             [FromQuery] int pageSize = 10,
             [FromQuery] string? sortBy = "date", 
             [FromQuery] string? sortDirection = "desc"
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
            // DÙNG KHỐI NÀY THAY THẾ
            if (tagId.HasValue)
            {
                // Lọc trực tiếp trên DTO: Kiểm tra xem list 'Tags' của ảnh
                // có 'bất kỳ' (Any) tag nào có Id trùng với tagId không.
                query = query.Where(i => i.Tags.Any(t => t.Id == tagId.Value));
            }
            else if (topicId.HasValue)
            {
                // Tương tự, lọc trực tiếp trên list 'Topics' của ảnh
                query = query.Where(i => i.Topics.Any(t => t.Id == topicId.Value));
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

            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
            {
                // So sánh chỉ phần Date (ngày/tháng/năm), bỏ qua Time (giờ/phút/giây)
                query = query.Where(i => i.CreatedAt.Date == parsedDate.Date);
            }
            if (!string.IsNullOrEmpty(sortBy))
            {
                query = sortBy.ToLower() switch
                {
                   "date" => sortDirection?.ToLower() == "asc" ? query.OrderBy(i => i.CreatedAt) : query.OrderByDescending(i => i.CreatedAt),
                    _ => query.OrderByDescending(i => i.CreatedAt) // mặc định
                };
            }
            else
            {
                query = query.OrderByDescending(i => i.CreatedAt);
            }
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
                uploadResult.fileUrl,
                uploadResult.thumbnailUrl,
                uploadResult.size,
                uploadResult.width,
                uploadResult.height,
                dto.IsPublic,
                dto.TagIds ?? new List<int>(),
                dto.TopicIds ?? new List<int>(),
                null // ✅ Status = null (sẽ tự set "pending" trong repository)
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

            var image = await _repository.GetByIdAsync(id); // Lấy bản gốc
            if (image == null) return NotFound();

            if (image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid();
            }

            // ✅ BƯỚC 1: Lấy trạng thái CŨ trước khi cập nhật
            // (Giả sử model 'Image' của bạn có thuộc tính 'Status')
            var oldStatus = image.Status;

            // Thực hiện cập nhật
            var success = await _repository.UpdateAsync(id, dto);
            if (!success) return NotFound();

   
            if (IsAdmin() && dto.Status != null && dto.Status == "approved" && oldStatus != "approved")
            {
                try
                {
                    var adminId = GetCurrentUserIdOrDefault(); // Chắc chắn có giá trị vì đã check IsAdmin()

                    var log = new AdminLog
                    {
                        AdminId = adminId.Value,
                        ActionType = "APPROVE_IMAGE", // ✅ Đã cố định
                        Target = image.Id, // ✅ Lấy 'int' Id từ 'image', không dùng 'string id'
                        Meta = $"Approved image (ID: {image.Id}, Title: {image.Title})" // ✅ Thông tin log rõ ràng hơn
                    };
                    _ = _adminLogRepository.CreateAsync(log); // Fire-and-forget
                }
                catch (Exception ex)
                {
                    // Ghi log lỗi nếu không tạo được AdminLog, nhưng không làm hỏng request chính
                    Console.WriteLine($"Failed to create admin log: {ex.Message}");
                }
            }
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