using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    [Authorize]
    public class AdminController : Controller
    {
        public IActionResult AdminHome()
        {
            return View();
        }
        public IActionResult AdminStats()
        {
            return View();
        }
        public IActionResult AdminImages()
        {
            var token = HttpContext.Session.GetString("JWToken");

            // 2. Truyền token này sang cho View
            ViewData["JwtToken"] = token;

            return View();
        }
        public IActionResult AdminUsers()
        {
              return View();
        }
        public IActionResult AdminTags_Topics()
        {
            return View();
        }
        public IActionResult AdminLogs()
        {
            return View();
        }
        public IActionResult AdminApproval()
        {
            return View();
        }
    }
}
