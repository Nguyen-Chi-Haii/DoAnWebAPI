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
        public IActionResult EditImage(string id)
        {
            // Kiểm tra xem ID có hợp lệ không
            if (string.IsNullOrEmpty(id))
            {
                // Nếu không có ID, có thể chuyển hướng về trang chủ hoặc trang lỗi
                return RedirectToAction("Index", "Home");
            }

            // Truyền ID vào View để JavaScript có thể sử dụng
            ViewBag.ImageId = id;

            // Trả về View EditImage.cshtml
            return View();
        }
    }
}
