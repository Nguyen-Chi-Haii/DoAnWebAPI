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

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Firebase credential
var credentialPath = Path.Combine(builder.Environment.ContentRootPath, "firebase-adminsdk.json");
var firebaseApp = FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromFile(credentialPath),
});
builder.Services.AddSingleton(firebaseApp);

// Đăng ký service
builder.Services.AddSingleton<FirebaseService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

// Thêm Form Options
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50MB
    options.ValueLengthLimit = int.MaxValue;
    options.MemoryBufferThreshold = int.MaxValue;
});

// Thêm HttpClient (quan trọng cho Cloudinary)
builder.Services.AddHttpClient();

// Đăng ký repository
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAdminLogRepository, AdminLogRepository>();
builder.Services.AddScoped<ITopicRepository, TopicRepository>();

// BUILD APP NGAY SAU KHI THÊM SERVICES (đây là điểm sửa chính)
var app = builder.Build();

// BÂY GIỜ MỚI CẤU HÌNH PIPELINE (sử dụng app)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DoAnWebAPI v1");
    });
}

//app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();