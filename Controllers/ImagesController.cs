using CloudinaryDotNet.Actions;
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI.Controllers
{
    [ApiController]                                 // Thêm cái này
    [Route("api/[controller]")]                     // Đặt base route
    public class ImagesController : ControllerBase
    {
        private readonly IImageRepository _repository;
        private readonly ICloudinaryService _cloudinaryService;

        public ImagesController(IImageRepository repository, ICloudinaryService cloudinaryService)
        {
            _repository = repository;
            _cloudinaryService = cloudinaryService;
        }


        [HttpGet]                                   // GET /api/images
        public async Task<ActionResult<IEnumerable<ImageDTO>>> GetAll()
        {
            return Ok(await _repository.GetAllAsync());
        }

        [HttpGet("{id}")]                           // GET /api/images/{id}
        public async Task<ActionResult<ImageDTO>> GetById(string id)
        {
            var image = await _repository.GetByIdAsync(id);
            if (image == null) return NotFound();
            return Ok(image);
        }
        [HttpPost]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(52428800)] // 50MB
        public async Task<ActionResult<ImageDTO>> Create([FromForm] CreateImageDTO dto)
        {
            Console.WriteLine("\n========== POST IMAGE REQUEST ==========");

            try
            {
                // 1. Validate file
                Console.WriteLine("Step 1: Validating file...");
                if (dto.File == null || dto.File.Length == 0)
                {
                    Console.WriteLine("❌ No file provided");
                    return BadRequest("File ảnh là bắt buộc.");
                }

                Console.WriteLine($"✓ File received: {dto.File.FileName}");
                Console.WriteLine($"  - Size: {dto.File.Length:N0} bytes ({dto.File.Length / 1024.0 / 1024.0:F2} MB)");
                Console.WriteLine($"  - Content-Type: {dto.File.ContentType}");

                // 2. Validate file type
                Console.WriteLine("Step 2: Validating file type...");
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(dto.File.ContentType?.ToLower()))
                {
                    Console.WriteLine($"❌ Invalid file type: {dto.File.ContentType}");
                    return BadRequest($"File type không hợp lệ. Chỉ chấp nhận: {string.Join(", ", allowedTypes)}");
                }
                Console.WriteLine("✓ File type valid");

                // 3. Upload to Cloudinary
                Console.WriteLine("Step 3: Uploading to Cloudinary...");
                var uploadResult = await _cloudinaryService.UploadImageAsync(dto.File);
                Console.WriteLine($"✓ Cloudinary upload successful!");
                Console.WriteLine($"  - URL: {uploadResult.fileUrl}");
                Console.WriteLine($"  - Size: {uploadResult.size:N0} bytes");
                Console.WriteLine($"  - Dimensions: {uploadResult.width}x{uploadResult.height}");

                // 4. Save to Firebase
                Console.WriteLine("Step 4: Saving metadata to Firebase...");
                var created = await _repository.CreateAsync(
                    dto,
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
            catch (HttpRequestException httpEx)
            {
                Console.WriteLine($"❌ HTTP ERROR: {httpEx.Message}");
                return StatusCode(503, new
                {
                    error = "Không thể kết nối đến Cloudinary",
                    details = httpEx.Message
                });
            }
            catch (TaskCanceledException timeoutEx)
            {
                Console.WriteLine($"❌ TIMEOUT: {timeoutEx.Message}");
                return StatusCode(504, new
                {
                    error = "Upload timeout - File quá lớn hoặc kết nối chậm",
                    details = timeoutEx.Message
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR: {ex.GetType().Name}");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }

                Console.WriteLine("========== FAILED ==========\n");

                return StatusCode(500, new
                {
                    error = ex.Message,
                    type = ex.GetType().Name,
                    innerError = ex.InnerException?.Message
                });
            }
        }


        [HttpPut("{id}")]                           // PUT /api/images/{id}
        public async Task<IActionResult> Update(string id, [FromBody] UpdateImageDTO dto)
        {
            var result = await _repository.UpdateAsync(id, dto);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]                        // DELETE /api/images/{id}
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _repository.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
