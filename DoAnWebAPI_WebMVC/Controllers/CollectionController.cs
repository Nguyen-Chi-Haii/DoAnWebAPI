using Microsoft.AspNetCore.Mvc;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class CollectionController : Controller
    {
        public IActionResult Collection()
        {
            return View();
        }
        public IActionResult CollectionDetail(string id)
        {
            // Truyền ID vào View để JavaScript có thể sử dụng
            ViewBag.CollectionId = id;
            return View();
        }
        public IActionResult AddCollection()
        {
            return View();
        }
        public IActionResult EditCollection(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("ID không được để trống.");
            }

            // Tại đây bạn sẽ lấy dữ liệu của bộ sưu tập từ DB dựa vào 'id'
            // và truyền nó vào View để form sửa có thể hiển thị thông tin cũ.

            ViewBag.CollectionId = id; // Truyền ID sang View

            // Giả sử bạn có một View tên là Edit.cshtml
            return View();
        }
        public IActionResult Delete(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("ID không được để trống.");
            }
            // Tại đây bạn sẽ lấy dữ liệu của bộ sưu tập từ DB dựa vào 'id'
            // và truyền nó vào View để xác nhận việc xóa.
            ViewBag.CollectionId = id; // Truyền ID sang View
            // Giả sử bạn có một View tên là Delete.cshtml
            return View("~/View/Collection/Collection");
        }
    }
}
