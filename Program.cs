using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var credentialPath = Path.Combine(builder.Environment.ContentRootPath, "firebase-adminsdk.json");

var firebaseApp = FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromFile(credentialPath),
});
builder.Services.AddSingleton(firebaseApp);

builder.Services.AddSingleton<FirebaseWebApi.Services.FirebaseService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
