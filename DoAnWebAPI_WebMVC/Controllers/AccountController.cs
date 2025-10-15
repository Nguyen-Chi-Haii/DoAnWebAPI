using DoAnWebAPI_WebMVC.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace DoAnWebAPI_WebMVC.Controllers
{
    public class AccountController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly string _apiBaseUrl;

        public AccountController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _apiBaseUrl = _configuration["ApiSettings:BaseUrl"];
        }

        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var client = _httpClientFactory.CreateClient();
            var json = JsonConvert.SerializeObject(model);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{_apiBaseUrl}/api/auth/login", content);

            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                var authResponse = JsonConvert.DeserializeObject<AuthResponseDTO>(responseString);

                // Lưu token vào Session hoặc Cookie
                HttpContext.Session.SetString("JWToken", authResponse.Token);

                return RedirectToAction("Index", "Home");
            }
            else
            {
                // Lấy thông điệp lỗi từ API (nếu có)
                var errorContent = await response.Content.ReadAsStringAsync();
                var errorResponse = JsonConvert.DeserializeObject<ErrorResponse>(errorContent);
                ModelState.AddModelError(string.Empty, errorResponse?.Message ?? "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
                return View(model);
            }
        }

        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            // Chuyển đổi từ RegisterViewModel sang RegisterDTO của API
            var registerDto = new
            {
                Username = model.FullName, // Sử dụng FullName làm Username
                Email = model.Email,
                Password = model.Password,
                ConfirmPassword = model.ConfirmPassword,
                Role = "User" // Gán vai trò mặc định là "User"
            };

            var client = _httpClientFactory.CreateClient();
            var json = JsonConvert.SerializeObject(registerDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{_apiBaseUrl}/api/auth/register", content);

            if (response.IsSuccessStatusCode)
            {
                // Chuyển hướng đến trang đăng nhập với thông báo thành công
                TempData["SuccessMessage"] = "Đăng ký tài khoản thành công! Vui lòng đăng nhập.";
                return RedirectToAction("Login");
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                var errorResponse = JsonConvert.DeserializeObject<ErrorResponse>(errorContent);
                ModelState.AddModelError(string.Empty, errorResponse?.Message ?? "Đăng ký không thành công. Vui lòng thử lại.");
                return View(model);
            }
        }

        [HttpPost]
        public IActionResult Logout()
        {
            // Xóa token khỏi Session
            HttpContext.Session.Remove("JWToken");
            return RedirectToAction("Login", "Account");
        }

        public IActionResult Setting()
        {
            return View();
        }

        // Lớp phụ trợ để deserialize thông điệp lỗi từ API
        private class ErrorResponse
        {
            public string Message { get; set; }
        }
        // Lớp phụ trợ để deserialize phản hồi đăng nhập thành công
        private class AuthResponseDTO
        {
            public string Token { get; set; }
            public string UserId { get; set; }
            public string Username { get; set; }
            public string Role { get; set; }
        }
    }
}