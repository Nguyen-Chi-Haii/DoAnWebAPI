using DoAnWebAPI.Model.DTO.Stats;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/images/{imageId}/stats")] // Base route for stats
    [AllowAnonymous] // Cho phép tất cả người dùng truy cập thống kê
    public class StatsController : ControllerBase
    {
        private readonly IStatRepository _statRepository;

        public StatsController(IStatRepository statRepository)
        {
            _statRepository = statRepository;
        }

        // GET /api/images/{imageId}/stats
        [HttpGet]
        public async Task<ActionResult<StatDTO>> GetStats(int imageId)
        {
            // ✅ Data Validation
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }

            var dto = await _statRepository.GetStatDTOByImageIdAsync(imageId);
            if (dto == null)
            {
                // Trả về DTO mặc định/rỗng (bao gồm LikesCount=0)
                return Ok(new StatDTO
                {
                    Id = imageId,
                    ImageId = imageId,
                    ViewsCount = 0,
                    DownloadCount = 0,
                    LikesCount = 0 
                });
            }
            return Ok(dto);
        }

        // POST /api/images/{imageId}/stats/view
        [HttpPost("increment-view")]
        public async Task<IActionResult> IncrementViewCount(int imageId)
        {
            // ✅ Data Validation
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }

            var updatedStat = await _statRepository.IncrementViewsAsync(imageId);
            var dto = new StatDTO
            {
                Id = updatedStat.Id,
                ImageId = updatedStat.ImageId,
                ViewsCount = updatedStat.ViewsCount,
                DownloadCount = updatedStat.DownloadCount,
                LikesCount = updatedStat.LikesCount
            };
            return Ok(dto);
        }

        // POST /api/images/{imageId}/stats/download
        [HttpPost("download")]
        public async Task<IActionResult> IncrementDownloadCount(int imageId)
        {
            // ✅ Data Validation
            if (imageId <= 0)
            {
                return BadRequest("ImageId không hợp lệ.");
            }

            var updatedStat = await _statRepository.IncrementDownloadsAsync(imageId);
            var dto = new StatDTO
            {
                Id = updatedStat.Id,
                ImageId = updatedStat.ImageId,
                ViewsCount = updatedStat.ViewsCount,
                DownloadCount = updatedStat.DownloadCount,
                LikesCount = updatedStat.LikesCount
            };
            return Ok(dto);
        }
    }
}