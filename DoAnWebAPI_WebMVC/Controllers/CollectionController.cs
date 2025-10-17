using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    [Authorize]
    public class CollectionController : Controller
    {
        public IActionResult Collection()
        {
            ViewData["ShowEditButton"] = true;
            return View();
        }

        // GET: /Collection/CollectionDetail/{id}
        public IActionResult CollectionDetail(string id)
        {
            if (string.IsNullOrEmpty(id) || !int.TryParse(id, out int collectionId))
            {
                return BadRequest("ID không hợp lệ.");
            }

            ViewBag.CollectionId = id;
            return View();
        }
        // GET: /Collection/AddCollection
        public IActionResult AddCollection()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Login", "Account");
            }
            return View();
        }
        public IActionResult EditCollection(string id)
        {
            if (string.IsNullOrEmpty(id) || !int.TryParse(id, out int collectionId))
            {
                return BadRequest("ID không hợp lệ.");
            }

            if (!User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Login", "Account");
            }

            // Tại đây bạn sẽ lấy dữ liệu của bộ sưu tập từ DB dựa vào 'id'
            // và truyền nó vào View để form sửa có thể hiển thị thông tin cũ.

            ViewBag.CollectionId = id; // Truyền ID sang View
            return View();
        }
        public IActionResult Delete(string id)
        {
            if (string.IsNullOrEmpty(id) || !int.TryParse(id, out int collectionId))
            {
                return BadRequest("ID không hợp lệ.");
            }

            if (!User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Login", "Account");
            }

            ViewBag.CollectionId = id;
            return View();
        }
    }
}
