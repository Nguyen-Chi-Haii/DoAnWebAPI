
using Microsoft.AspNetCore.Mvc;
public class AdminController : Controller
{
    private bool IsAdmin()
    {
        return HttpContext.Session.GetString("UserRole") == "Admin";
    }

    public IActionResult AdminHome()
    {
        // ✅ BƯỚC 3: THÊM ĐOẠN KIỂM TRA NÀY VÀO ĐẦU MỖI ACTION
        if (!IsAdmin())
        {
            // Nếu không phải Admin, đá về trang đăng nhập
            return RedirectToAction("Login", "Account");
        }

        // Nếu là Admin, code sẽ tiếp tục chạy như bình thường
        return View();
    }

    public IActionResult AdminUsers()
    {
        // ✅ THÊM VÀO ĐÂY
        if (!IsAdmin()) return RedirectToAction("Login", "Account");

        return View();
    }

    public IActionResult AdminImages()
    {
        // ✅ THÊM VÀO ĐÂY
        if (!IsAdmin()) return RedirectToAction("Login", "Account");

        return View();
    }

    // LÀM TƯƠNG TỰ CHO TẤT CẢ CÁC ACTION CÒN LẠI TRONG CONTROLLER NÀY...
    public IActionResult AdminTags_Topics()
    {
        if (!IsAdmin()) return RedirectToAction("Login", "Account");
        return View();
    }

    public IActionResult AdminApproval()
    {
        if (!IsAdmin()) return RedirectToAction("Login", "Account");
        return View();
    }

    public IActionResult AdminStats()
    {
        if (!IsAdmin()) return RedirectToAction("Login", "Account");
        return View();
    }

    public IActionResult AdminLogs()
    {
        if (!IsAdmin()) return RedirectToAction("Login", "Account");
        return View();
    }
}