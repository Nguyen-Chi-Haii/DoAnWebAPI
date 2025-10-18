var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------
// 1. ĐĂNG KÝ CÁC DỊCH VỤ CẦN THIẾT
// ---------------------------------------------------

// Thêm các dịch vụ cơ bản cho MVC
builder.Services.AddControllersWithViews();

// Thêm IHttpClientFactory để gọi API một cách hiệu quả
builder.Services.AddHttpClient();

// Thêm IHttpContextAccessor để có thể truy cập HttpContext (và Session) từ các view
builder.Services.AddHttpContextAccessor();

// Thêm và cấu hình dịch vụ Session để lưu trữ token đăng nhập
builder.Services.AddSession(options =>
{
    // Đặt thời gian timeout cho session (ví dụ: 30 phút không hoạt động)
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true; // Cookie không thể được truy cập bằng script phía client
    options.Cookie.IsEssential = true; // Đánh dấu cookie này là cần thiết cho ứng dụng
});



// ---------------------------------------------------
// 2. XÂY DỰNG ỨNG DỤNG
// ---------------------------------------------------
var app = builder.Build();


// ---------------------------------------------------
// 3. CẤU HÌNH HTTP REQUEST PIPELINE (MIDDLEWARE)
// ---------------------------------------------------

// Cấu hình cho môi trường Production (không phải Development)
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// Tự động chuyển hướng các yêu cầu HTTP sang HTTPS
app.UseHttpsRedirection();

// Cho phép phục vụ các file tĩnh như CSS, JavaScript, hình ảnh từ thư mục wwwroot
app.UseStaticFiles();

// Kích hoạt cơ chế định tuyến (routing) để map URL tới các action trong controller
app.UseRouting();

// Kích hoạt middleware của Session.
// Vị trí này RẤT QUAN TRỌNG: phải sau UseRouting và trước UseAuthorization/MapControllerRoute.
app.UseSession();

// Kích hoạt middleware phân quyền
app.UseAuthorization();

// Thiết lập định tuyến mặc định cho URL
// URL trống sẽ trỏ đến HomeController và action Index
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Chạy ứng dụng
app.Run();