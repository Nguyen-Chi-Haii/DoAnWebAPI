using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class CollectionController : Controller
    {
        // Action này hiển thị trang chính của bộ sưu tập
        public IActionResult Collection()
        {
            // Lấy ID người dùng từ Session
            var userId = HttpContext.Session.GetString("UserId");

            // Nếu không có UserId (chưa đăng nhập), chuyển hướng về trang Login
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login", "Account");
            }

            // Truyền UserId sang cho View để JavaScript có thể sử dụng
            ViewBag.UserId = userId;

            return View();
        }

        // Các action khác như AddCollection, EditCollection, CollectionDetail giữ nguyên...
        public IActionResult AddCollection(string initialImageId, string previewUrl)
        {
            if (string.IsNullOrEmpty(HttpContext.Session.GetString("UserId")))
            {
                return RedirectToAction("Login", "Account");
            }

            // Truyền dữ liệu sang View
            ViewBag.InitialImageId = initialImageId;
            ViewBag.PreviewUrl = previewUrl;

            return View();
        }

        public IActionResult EditCollection(string id)
        {
            if (string.IsNullOrEmpty(HttpContext.Session.GetString("UserId")))
            {
                return RedirectToAction("Login", "Account");
            }
            ViewBag.CollectionId = id;
            return View();
        }

        public IActionResult CollectionDetail(string id)
        {
            if (string.IsNullOrEmpty(HttpContext.Session.GetString("UserId")))
            {
                return RedirectToAction("Login", "Account");
            }
            ViewBag.CollectionId = id;
            return View();
        }
    }
}