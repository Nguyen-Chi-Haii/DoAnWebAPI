using DoAnWebAPI.Repositories;
using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Interface;
using DoAnWebAPI.Services.Repositories;
using Firebase.Database;
using FirebaseAdmin;
using FirebaseWebApi.Repositories;
using FireSharp.Config;
using Google.Apis.Auth.OAuth2;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --------------------
// 🧩 CẤU HÌNH CƠ BẢN
// --------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ✅ SWAGGER HỖ TRỢ FIREBASE TOKEN
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "DoAnWebAPI", Version = "v1" });

    options.AddSecurityDefinition("FirebaseBearer", new OpenApiSecurityScheme
    {
        Description = "Nhập Firebase ID Token (Bearer {token})",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "FirebaseBearer"
                }
            },
            new List<string>()
        }
    });
});

builder.Services.AddLogging();

// --------------------
// 🔥 CẤU HÌNH FIREBASE
// --------------------
var credentialPath = Path.Combine(builder.Environment.ContentRootPath, "firebase-adminsdk.json");
var firebaseApp = FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromFile(credentialPath),
});
builder.Services.AddSingleton(firebaseApp);
builder.Services.AddSingleton<FirebaseService>();

// 🔑 Đăng ký FirebaseClient cho Realtime Database
var firebaseBaseUrl = builder.Configuration["Firebase:DatabaseUrl"];
var firebaseSecret = builder.Configuration["Firebase:DatabaseSecret"];
builder.Services.AddSingleton(provider =>
    new FireSharp.FirebaseClient(new FirebaseConfig
    {
        AuthSecret = firebaseSecret,
        BasePath = firebaseBaseUrl
    }));

// --------------------
// 🔐 AUTH FIREBASE ID TOKEN
// --------------------
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "FirebaseBearer";
    options.DefaultChallengeScheme = "FirebaseBearer";
})
.AddJwtBearer("FirebaseBearer", options =>
{
    options.Authority = "https://securetoken.google.com/photogallerydb-196ef";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = "https://securetoken.google.com/photogallerydb-196ef",
        ValidateAudience = true,
        ValidAudience = "photogallerydb-196ef",
        ValidateLifetime = true,
    };
});

// --------------------
// 🔓 PHÂN QUYỀN
// --------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("role", "admin"));
    options.AddPolicy("UserOrAdmin", policy => policy.RequireClaim("role", "user", "admin"));
});

// --------------------
// ☁️ DỊCH VỤ KHÁC
// --------------------
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddHttpClient();
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 52428800;
});

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
// 🌐 CORS
// --------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// --------------------
// 🧑‍💻 DEV TOOLS
// --------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
