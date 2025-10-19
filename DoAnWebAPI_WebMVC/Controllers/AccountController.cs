using DoAnWebAPI_WebMVC.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Collections.Generic;
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

                HttpContext.Session.SetString("JWToken", authResponse.Token);
                HttpContext.Session.SetString("Username", authResponse.Username);
                HttpContext.Session.SetString("UserId", authResponse.UserId);
                HttpContext.Session.SetString("UserRole", authResponse.Role);
                return RedirectToAction("Index", "Home");
            }
            else
            {
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

            var registerDto = new
            {
                Username = model.FullName,
                Email = model.Email,
                Password = model.Password,
                ConfirmPassword = model.ConfirmPassword,
                Role = "User"
            };

            var client = _httpClientFactory.CreateClient();
            var json = JsonConvert.SerializeObject(registerDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{_apiBaseUrl}/api/auth/register", content);

            if (response.IsSuccessStatusCode)
            {
                TempData["SuccessMessage"] = "Đăng ký tài khoản thành công! Vui lòng đăng nhập.";
                return RedirectToAction("Login");
            }
            else
            {
                // ✅ LOGIC XỬ LÝ LỖI CHI TIẾT ĐÃ ĐƯỢC NÂNG CẤP
                var errorContent = await response.Content.ReadAsStringAsync();
                try
                {
                    // Thử phân tích lỗi validation chi tiết (ví dụ: mật khẩu yếu)
                    var validationErrors = JsonConvert.DeserializeObject<ValidationErrorsResponse>(errorContent);
                    if (validationErrors?.Errors != null && validationErrors.Errors.Count > 0)
                    {
                        foreach (var errorList in validationErrors.Errors.Values)
                        {
                            foreach (var errorMessage in errorList)
                            {
                                ModelState.AddModelError(string.Empty, errorMessage);
                            }
                        }
                    }
                    else
                    {
                        // Nếu không phải lỗi validation, thử phân tích lỗi đơn giản (ví dụ: email tồn tại)
                        var simpleError = JsonConvert.DeserializeObject<ErrorResponse>(errorContent);
                        if (!string.IsNullOrEmpty(simpleError?.Message))
                        {
                            ModelState.AddModelError(string.Empty, simpleError.Message);
                        }
                        else
                        {
                            ModelState.AddModelError(string.Empty, "Đăng ký không thành công. Đã có lỗi xảy ra.");
                        }
                    }
                }
                catch (JsonException)
                {
                    // Nếu không thể phân tích JSON, hiển thị nội dung lỗi thô
                    ModelState.AddModelError(string.Empty, errorContent);
                }

                return View(model);
            }
        }

        [HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Remove("JWToken");
            HttpContext.Session.Remove("Username");
            HttpContext.Session.Remove("UserId");
            HttpContext.Session.Remove("UserRole");
            return RedirectToAction("Login", "Account");
        }

        public IActionResult Setting()
        {
            var token = HttpContext.Session.GetString("JWToken");
            var username = HttpContext.Session.GetString("Username");
            var userId = HttpContext.Session.GetString("UserId");

            // Nếu chưa đăng nhập -> đá về trang Login
            if (string.IsNullOrEmpty(token))
            {
                return RedirectToAction("Login");
            }

            // ✅ Truyền token và userId sang View
            ViewBag.JwtToken = token;
            ViewBag.UserId = userId;

            return View();
        }

        // --- CÁC LỚP PHỤ TRỢ ---

        private class ErrorResponse
        {
            public string Message { get; set; }
        }

        // Dùng cho các lỗi validation từ API
        private class ValidationErrorsResponse
        {
            public Dictionary<string, string[]> Errors { get; set; }
        }

        private class AuthResponseDTO
        {
            public string Token { get; set; }
            public string UserId { get; set; }
            public string Username { get; set; }
            public string Role { get; set; }
        }
    }
}