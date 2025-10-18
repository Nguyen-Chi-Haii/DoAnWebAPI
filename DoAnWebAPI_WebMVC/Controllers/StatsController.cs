using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class StatsController : Controller
    {
        public IActionResult UserStats()
        {
            var userId = HttpContext.Session.GetString("UserId");

            // QUAN TRỌNG: Kiểm tra xem người dùng đã đăng nhập hay chưa.
            if (string.IsNullOrEmpty(userId))
            {
                // Nếu chưa đăng nhập, chuyển hướng về trang Login
                return RedirectToAction("Login", "Account");
            }

            // Truyền UserId sang View để JavaScript sử dụng.
            // Không cần truyền token nữa vì apiServices đã tự xử lý.
            ViewBag.UserId = userId;

            return View();
        }
    }
}