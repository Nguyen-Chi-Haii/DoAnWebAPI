using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class StatsController : Controller
    {
        [Authorize]
        public IActionResult UserStats()
        {
            // 1. Đọc token từ Session
            var token = HttpContext.Session.GetString("JWToken");
            var userId = HttpContext.Session.GetString("UserId");

            // 2. Truyền cả token và userId sang View
            ViewBag.JwtToken = token;
            ViewBag.UserId = userId;
            return View();
        }
    }
}
