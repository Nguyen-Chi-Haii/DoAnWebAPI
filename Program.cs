using DoAnWebAPI.Services;
using DoAnWebAPI.Services.Repositories;
using FirebaseAdmin;
using FirebaseWebApi.Repositories;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Builder;
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
builder.Services.AddSingleton<CloudinaryService>();

// Đăng ký repository
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAdminLogRepository, AdminLogRepository>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DoAnWebAPI v1");
    });
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
