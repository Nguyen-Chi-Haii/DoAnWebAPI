using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class ImageController : Controller
    {
        public IActionResult ImageDetail()
        {
            return View();
        }
        public IActionResult AddImage()
        {
            return View();
        }
        [Authorize] // Đảm bảo chỉ người dùng đã đăng nhập mới có thể sửa ảnh
        public IActionResult EditImage(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Cần có ID của ảnh để chỉnh sửa.");
            }

            // Truyền ID của ảnh sang View để JavaScript có thể lấy và gọi API
            ViewData["ImageId"] = id;

            return View();
        }
    }
}
