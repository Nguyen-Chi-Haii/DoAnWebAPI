using DoAnWebAPI.Model.DTO.Stats;
using DoAnWebAPI.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace DoAnWebAPI.Controllers
{
    [ApiController]
    [Route("api/images/{imageId}/stats")] // Base route for stats
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
            var dto = await _statRepository.GetStatDTOByImageIdAsync(imageId);
            if (dto == null)
            {
                // If no stats exist, return a default/empty DTO
                return Ok(new StatDTO
                {
                    Id = 0, // Placeholder
                    ImageId = imageId,
                    ViewsCount = 0,
                    DownloadCount = 0
                });
            }
            return Ok(dto);
        }

        // POST /api/images/{imageId}/stats/view
        [HttpPost("view")]
        public async Task<IActionResult> IncrementViewCount(int imageId)
        {
            var updatedStat = await _statRepository.IncrementViewsAsync(imageId);
            var dto = new StatDTO
            {
                Id = updatedStat.Id,
                ImageId = updatedStat.ImageId,
                ViewsCount = updatedStat.ViewsCount,
                DownloadCount = updatedStat.DownloadCount
            };
            return Ok(dto);
        }

        // POST /api/images/{imageId}/stats/download
        [HttpPost("download")]
        public async Task<IActionResult> IncrementDownloadCount(int imageId)
        {
            var updatedStat = await _statRepository.IncrementDownloadsAsync(imageId);
            var dto = new StatDTO
            {
                Id = updatedStat.Id,
                ImageId = updatedStat.ImageId,
                ViewsCount = updatedStat.ViewsCount,
                DownloadCount = updatedStat.DownloadCount
            };
            return Ok(dto);
        }
    }
}