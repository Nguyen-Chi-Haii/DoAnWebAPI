using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using Firebase.Database; // <-- Giữ nguyên
using FirebaseAdmin;
using FirebaseWebApi.Repositories; // Thư viện cũ, có thể không cần
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FireSharp.Config;
using System.IO;
using System;
using FireSharp;
using Microsoft.AspNetCore.Authentication.JwtBearer; // ✅ THÊM
using Microsoft.IdentityModel.Tokens; // ✅ THÊM
using System.Text; // ✅ THÊM
using Microsoft.Extensions.Logging; // Thêm Logging

var builder = WebApplication.CreateBuilder(args);

// --------------------
// 🧩 CẤU HÌNH CƠ BẢN
// --------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddLogging(); // Thêm Logging

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

// 🔑 LẤY GIÁ TRỊ CẤU HÌNH TỪ APPSETTINGS
var firebaseBaseUrl = builder.Configuration["Firebase:DatabaseUrl"];
var firebaseSecret = builder.Configuration["Firebase:DatabaseSecret"];

// ✅ Đăng ký FirebaseClient cho Realtime Database
builder.Services.AddSingleton(provider =>
    new FireSharp.FirebaseClient(new FirebaseConfig
    {
        AuthSecret = firebaseSecret,
        BasePath = firebaseBaseUrl
    }));

// --------------------
// 🔑 CẤU HÌNH XÁC THỰC (Hợp nhất cả Mock JWT và Firebase Bearer)
// --------------------
var jwtSecretKey = builder.Configuration["Jwt:Key"] ?? "ThisIsAStrongDefaultSecretKeyForTesting";

// Cấu hình Mock JWT Bearer (Cho Login endpoint cũ)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "YourApiIssuer",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "YourApiAudience",

            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

// Thêm cấu hình Firebase Bearer mới (Tên Scheme khác để không bị conflict)
builder.Services.AddAuthentication(options =>
{
    // Đặt mặc định là FirebaseBearer (ưu tiên cơ chế mới)
    options.DefaultAuthenticateScheme = "FirebaseBearer";
    options.DefaultChallengeScheme = "FirebaseBearer";
})
    .AddJwtBearer("FirebaseBearer", options =>
    {
        // Thông tin cố định cho Firebase Auth
        options.Authority = "https://securetoken.google.com/photogallerydb-196ef";
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "https://securetoken.google.com/photogallerydb-196ef",
            ValidateAudience = true,
            ValidAudience = "photogallerydb-196ef",
            ValidateLifetime = true,
        };
    });

// --------------------
// 🔓 CẤU HÌNH PHÂN QUYỀN
// --------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("role", "admin"));
    options.AddPolicy("UserOrAdmin", policy => policy.RequireClaim("role", "user", "admin"));
});

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
builder.Services.AddScoped<ICollectionRepository, CollectionRepository>();
builder.Services.AddScoped<ICollectionImageRepository, CollectionImageRepository>();
builder.Services.AddScoped<ILikeRepository, LikeRepository>();
builder.Services.AddScoped<IStatRepository, StatRepository>();
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
// ✅ FIX: Thêm UseAuthentication trước UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
