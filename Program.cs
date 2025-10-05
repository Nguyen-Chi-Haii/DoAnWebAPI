using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using Firebase.Database;
using FirebaseAdmin;
using FirebaseWebApi.Repositories;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// --------------------
// 🧩 CẤU HÌNH CƠ BẢN
// --------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --------------------
// 🔥 CẤU HÌNH FIREBASE
// --------------------
var credentialPath = Path.Combine(builder.Environment.ContentRootPath, "firebase-adminsdk.json");
var firebaseApp = FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromFile(credentialPath),
});
builder.Services.AddSingleton(firebaseApp);

// Đăng ký FirebaseService (quản lý các thao tác Firebase)
builder.Services.AddSingleton<FirebaseService>();

// ✅ Đăng ký FirebaseClient cho Realtime Database
builder.Services.AddSingleton(provider =>
    new FirebaseClient("https://photogallerydb-196ef-default-rtdb.firebaseio.com/"));

// --------------------
// ☁️ CLOUDINARY SERVICE
// --------------------
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

// --------------------
// 📦 FORM OPTIONS (Upload file lớn)
// --------------------
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50MB
    options.ValueLengthLimit = int.MaxValue;
    options.MemoryBufferThreshold = int.MaxValue;
});

// --------------------
// 🌐 HTTP CLIENT (cho Cloudinary)
// --------------------
builder.Services.AddHttpClient();

// --------------------
// 🧱 REPOSITORIES
// --------------------
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IImageRepository, ImageRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddScoped<IImageTopicRepository, ImageTopicRepository>();
builder.Services.AddScoped<IImageTagRepository, ImageTagRepository>();
builder.Services.AddScoped<IAdminLogRepository, AdminLogRepository>();
builder.Services.AddScoped<ITopicRepository, TopicRepository>();
builder.Services.AddScoped<IPendingImageRepository, PendingImageRepository>();
// --------------------
// 🔓 CORS
// --------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// --------------------
// 🚀 BUILD APP
// --------------------
var app = builder.Build();

// --------------------
// ⚠️ GLOBAL ERROR HANDLING
// --------------------
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"🔥 Global Exception: {ex}");
        throw;
    }
});

// --------------------
// 🧑‍💻 DEV TOOLS
// --------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DoAnWebAPI v1");
    });
}

// --------------------
// 🌍 PIPELINE
// --------------------
// app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.Run();
