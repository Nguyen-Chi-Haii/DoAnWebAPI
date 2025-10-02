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
builder.Services.AddScoped<IImageRepository, ImageRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();
builder.Services.AddSingleton<FirebaseClient>(provider =>
    new FirebaseClient("https://photogallerydb-196ef-default-rtdb.firebaseio.com/"));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
var app = builder.Build();

// Global error handling
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Global Exception: {ex}");
        throw;
    }
});

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
