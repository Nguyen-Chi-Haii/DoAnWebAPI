using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class StatsController : Controller
    {
        public IActionResult UserStats()
        {
            return View();
        }
    }
}
