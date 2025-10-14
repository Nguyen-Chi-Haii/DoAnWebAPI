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
    [Authorize]
    public class ImagesController : ControllerBase
    {
        private readonly IImageRepository _repository;
        private readonly ICloudinaryService _cloudinaryService;

        public ImagesController(IImageRepository repository, ICloudinaryService cloudinaryService)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
        }

        // ✅ FIX LỖI 401: Lấy Local ID (integer) từ Custom Claim "local_id"
        private int GetCurrentUserId()
        {
            // 💡 Tìm kiếm Custom Claim "local_id" (được thiết lập trong AuthController)
            var userIdClaim = User.FindFirst("local_id");

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                // Thông báo cụ thể hơn để biết cần phải tạo token mới
                throw new UnauthorizedAccessException("Người dùng chưa được xác thực hoặc không tìm thấy Local ID (int) trong token. Vui lòng login lại.");
            }
            return userId;
        }

        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }


        // GET /api/images
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ImageDTO>>> GetAll()
        {
            var currentUserId = 0;
            if (User.Identity.IsAuthenticated)
            {
                try
                {
                    currentUserId = GetCurrentUserId();
                }
                catch
                {
                    currentUserId = 0;
                }
            }

            var allImages = await _repository.GetAllAsync();

            if (IsAdmin())
            {
                return Ok(allImages);
            }

            var filteredImages = allImages.Where(image =>
                image.IsPublic || (image.UserId == currentUserId && currentUserId != 0)
            );

            return Ok(filteredImages);
        }

        // GET /api/images/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
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
                // ✅ ĐÃ SỬA: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn không có quyền truy cập ảnh private này." });
            }

            return Ok(image);
        }

        // POST /api/images
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(52428800)]
        public async Task<ActionResult<ImageDTO>> Create([FromForm] CreateImageDTO dto)
        {
            Console.WriteLine("\n========== POST IMAGE REQUEST ==========");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            int currentUserId;
            try
            {
                currentUserId = GetCurrentUserId(); // Lấy Local ID đã sửa lỗi
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }

            try
            {
                Console.WriteLine("Step 1: Validating file...");
                if (dto.File == null || dto.File.Length == 0)
                {
                    return BadRequest("File ảnh là bắt buộc.");
                }
                Console.WriteLine($"✓ File received: {dto.File.FileName}");

                Console.WriteLine("Step 2: Validating file type...");
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(dto.File.ContentType?.ToLower()))
                {
                    return BadRequest($"File type không hợp lệ. Chỉ chấp nhận: {string.Join(", ", allowedTypes)}");
                }
                Console.WriteLine("✓ File type valid");


                Console.WriteLine("Step 3: Uploading to Cloudinary...");
                var uploadResult = await _cloudinaryService.UploadImageAsync(dto.File);
                Console.WriteLine($"✓ Cloudinary upload successful!");

                Console.WriteLine("Step 4: Saving metadata to Firebase...");

                var created = await _repository.CreateAsync(
                    currentUserId,
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
        public async Task<IActionResult> Update(string id, [FromBody] UpdateImageDTO dto)
        {
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

            if (existingImage.UserId != currentUserId && !IsAdmin())
            {
                // ✅ ĐÃ SỬA: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn chỉ có thể chỉnh sửa ảnh của chính mình hoặc phải có quyền Admin." });
            }

            var result = await _repository.UpdateAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        // DELETE /api/images/{id}
        [HttpDelete("{id}")]
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

            if (existingImage.UserId != currentUserId && !IsAdmin())
            {
                // ✅ ĐÃ SỬA: Trả về StatusCode(403) thay vì Forbid("message")
                return StatusCode(403, new { Message = "Bạn chỉ có thể xóa ảnh của chính mình hoặc phải có quyền Admin." });
            }

            var result = await _repository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}