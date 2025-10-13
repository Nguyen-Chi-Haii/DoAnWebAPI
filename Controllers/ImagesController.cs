using CloudinaryDotNet.Actions;
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;
using System.Net.Http;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // 🔐 Yêu cầu xác thực cho tất cả endpoints theo mặc định
    public class ImagesController : ControllerBase
    {
        private readonly IImageRepository _repository;
        private readonly ICloudinaryService _cloudinaryService;

        public ImagesController(IImageRepository repository, ICloudinaryService cloudinaryService)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
        }

        // Helper để lấy ID người dùng đã xác thực
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy ID.");
            }
            return userId;
        }

        // Helper để kiểm tra Admin (Giả định Role Claim tồn tại)
        private bool IsAdmin()
        {
            // 🔑 Kiểm tra Role "Admin" từ Claims (Giả định đã cấu hình Role)
            return User.IsInRole("Admin");
        }


        // GET /api/images
        [HttpGet]
        [AllowAnonymous] // Cho phép xem public images mà không cần đăng nhập
        public async Task<ActionResult<IEnumerable<ImageDTO>>> GetAll()
        {
            var currentUserId = 0;
            if (User.Identity.IsAuthenticated)
            {
                try { currentUserId = GetCurrentUserId(); } catch { /* Bỏ qua lỗi parsing */ }
            }

            var allImages = await _repository.GetAllAsync();

            if (IsAdmin())
            {
                // Admin thấy tất cả ảnh
                return Ok(allImages);
            }

            // User/Guest filter: Public images HOẶC ảnh của chính người dùng hiện tại
            var filteredImages = allImages.Where(image =>
                image.IsPublic || (image.UserId == currentUserId && currentUserId != 0)
            );

            return Ok(filteredImages);
        }

        // GET /api/images/{id}
        [HttpGet("{id}")]
        [AllowAnonymous] // Cho phép xem public images mà không cần đăng nhập
        public async Task<ActionResult<ImageDTO>> GetById(string id)
        {
            var image = await _repository.GetByIdAsync(id);
            if (image == null) return NotFound();

            var currentUserId = 0;
            if (User.Identity.IsAuthenticated)
            {
                try { currentUserId = GetCurrentUserId(); } catch { /* Bỏ qua lỗi parsing */ }
            }

            // 🔑 Phân quyền: Nếu không Public VÀ không phải Admin VÀ không phải chủ sở hữu -> Forbidden
            if (!image.IsPublic && image.UserId != currentUserId && !IsAdmin())
            {
                return Forbid("Bạn không có quyền truy cập ảnh private này."); // 403 Forbidden
            }

            return Ok(image);
        }

        // POST /api/images
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(52428800)] // 50MB
        // 🔐 Yêu cầu đăng nhập (sử dụng [Authorize] ở cấp Controller)
        public async Task<ActionResult<ImageDTO>> Create([FromForm] CreateImageDTO dto)
        {
            Console.WriteLine("\n========== POST IMAGE REQUEST ==========");

            // ✅ Data Validation (kiểm tra Data Annotations)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int currentUserId;
            try
            {
                // 🔑 Lấy UserId từ token (NGUỒN ĐÁNG TIN CẬY)
                currentUserId = GetCurrentUserId();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            try
            {
                // 1. Validate file (Đã có sẵn logic)
                Console.WriteLine("Step 1: Validating file...");
                if (dto.File == null || dto.File.Length == 0)
                {
                    return BadRequest("File ảnh là bắt buộc.");
                }
                Console.WriteLine($"✓ File received: {dto.File.FileName}");

                // 2. Validate file type
                Console.WriteLine("Step 2: Validating file type...");
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(dto.File.ContentType?.ToLower()))
                {
                    return BadRequest($"File type không hợp lệ. Chỉ chấp nhận: {string.Join(", ", allowedTypes)}");
                }
                Console.WriteLine("✓ File type valid");


                // 3. Upload to Cloudinary
                Console.WriteLine("Step 3: Uploading to Cloudinary...");
                var uploadResult = await _cloudinaryService.UploadImageAsync(dto.File);
                Console.WriteLine($"✓ Cloudinary upload successful!");

                // 4. Save to Firebase
                Console.WriteLine("Step 4: Saving metadata to Firebase...");

                // ✅ Gọi CreateAsync với chữ ký mới, truyền UserId an toàn
                var created = await _repository.CreateAsync(
                    currentUserId, // 🔑 UserId an toàn
                    dto.Title,
                    dto.Description,
                    dto.IsPublic,
                    dto.TagIds,
                    dto.TopicIds,
                    uploadResult.fileUrl,
                    uploadResult.thumbnailUrl,
                    uploadResult.size,
                    uploadResult.width,
                    uploadResult.height
                );

                Console.WriteLine($"✓ Image saved to Firebase with ID: {created.Id}");
                Console.WriteLine("========== SUCCESS ==========\n");

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR: {ex.GetType().Name}");
                if (ex is HttpRequestException httpEx)
                {
                    return StatusCode(503, new { error = "Không thể kết nối đến Cloudinary", details = httpEx.Message });
                }
                else if (ex is TaskCanceledException timeoutEx)
                {
                    return StatusCode(504, new { error = "Upload timeout - File quá lớn hoặc kết nối chậm", details = timeoutEx.Message });
                }

                return StatusCode(500, new
                {
                    error = ex.Message,
                    type = ex.GetType().Name,
                    innerError = ex.InnerException?.Message
                });
            }
        }


        // PUT /api/images/{id}
        [HttpPut("{id}")]
        // 🔐 Chỉ Admin hoặc Chủ sở hữu mới được cập nhật
        public async Task<IActionResult> Update(string id, [FromBody] UpdateImageDTO dto)
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

            var existingImage = await _repository.GetByIdAsync(id);
            if (existingImage == null) return NotFound();

            // 🔑 Phân quyền: Kiểm tra quyền sở hữu HOẶC Admin
            if (existingImage.UserId != currentUserId && !IsAdmin())
            {
                return Forbid("Bạn chỉ có thể chỉnh sửa ảnh của chính mình hoặc phải có quyền Admin."); // 403 Forbidden
            }

            var result = await _repository.UpdateAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        // DELETE /api/images/{id}
        [HttpDelete("{id}")]
        // 🔐 Chỉ Admin hoặc Chủ sở hữu mới được xóa
        public async Task<IActionResult> Delete(string id)
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

            var existingImage = await _repository.GetByIdAsync(id);
            if (existingImage == null) return NotFound();

            // 🔑 Phân quyền: Kiểm tra quyền sở hữu HOẶC Admin
            if (existingImage.UserId != currentUserId && !IsAdmin())
            {
                return Forbid("Bạn chỉ có thể xóa ảnh của chính mình hoặc phải có quyền Admin."); // 403 Forbidden
            }

            var result = await _repository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}