using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
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
