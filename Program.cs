using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using Firebase.Database; // <-- Giữ nguyên, nhưng không sử dụng client từ đây
using FirebaseAdmin;
using FirebaseWebApi.Repositories;
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

// 🔑 LẤY GIÁ TRỊ CẤU HÌNH TỪ APPSETTINGS
var firebaseBaseUrl = builder.Configuration["Firebase:DatabaseUrl"];
var firebaseSecret = builder.Configuration["Firebase:DatabaseSecret"];

// ✅ Đăng ký FirebaseClient cho Realtime Database (ĐÃ SỬ DỤNG TÊN ĐẦY ĐỦ)
builder.Services.AddSingleton(provider =>
    new FireSharp.FirebaseClient(new FirebaseConfig
    {
        AuthSecret = firebaseSecret,
        BasePath = firebaseBaseUrl
    }));

// --------------------
// 🔑 CẤU HÌNH XÁC THỰC JWT BEARER (Đã thêm ở bước trước)
// --------------------
var jwtSecretKey = builder.Configuration["Jwt:Key"] ?? "ThisIsAStrongDefaultSecretKeyForTesting";

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
// 🚀 BUILD APP (Đây là nơi biến 'app' được tạo ra)
// --------------------
var app = builder.Build();

// --------------------
// ⚠️ GLOBAL ERROR HANDLING (Sử dụng 'app' sau khi Build)
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
// 🧑‍💻 DEV TOOLS (Sử dụng 'app' sau khi Build)
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
// 🌍 PIPELINE (Sử dụng 'app' sau khi Build)
// --------------------
// app.UseHttpsRedirection();
app.UseCors("AllowAll");
// ✅ FIX: Thêm UseAuthentication trước UseAuthorization
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();