using API.Repository.global;
using API.Repository.Master;
using API.Repository.Transaction;
using API.Service.Master;
using API.Service.Transaction;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var allowedOrigins = builder.Configuration.GetSection("AppClient:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

//var server = builder.Configuration["DB_SERVER"];
//var db = builder.Configuration["DB_NAME"];
//var user = builder.Configuration["DB_USER"];
//var pass = builder.Configuration["DB_PASSWORD"];

//var connStr = $"Server={server};Database={db};User Id={user};Password={pass};";

// (Kalau masih pakai EF) - kalau fokus Dapper, ini bisa dihapus nanti
//builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connStr));

// Dapper connection
builder.Services.AddScoped<IDbConnection>(sp =>
    new SqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger + Bearer
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Masukkan: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("BC",
        policy =>
        {
            if (allowedOrigins.Length == 0)
            {
                policy.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
                return;
            }

            policy.WithOrigins(allowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

// JWT
var jwt = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwt["Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// Register repo dan service
builder.Services.AddScoped<RepoMasterItem>();
builder.Services.AddScoped<ServiceMasterItem>();
builder.Services.AddScoped<RepoMasterDonatur>();
builder.Services.AddScoped<ServiceMasterDonatur>();
builder.Services.AddScoped<ServiceMasterPendoa>();
builder.Services.AddScoped<RepoMasterPendoa>();
builder.Services.AddScoped<RepoMasterUser>();
builder.Services.AddScoped<RepoWhatsAppSchedule>();
builder.Services.AddScoped<RepoApplicationSetting>();
builder.Services.AddScoped<RepoTRBirthdayPray>();
builder.Services.AddScoped<RepoTRBuletin>();
builder.Services.AddScoped<ServiceTRBirthdayPray>();
builder.Services.AddScoped<ServiceTRBuletin>();
builder.Services.AddScoped<ServiceMasterUser>();
builder.Services.AddScoped<ServiceWhatsAppSchedule>();
builder.Services.AddScoped<ServiceApplicationSetting>();
builder.Services.AddHostedService<WhatsAppSchedulerWorker>();

var app = builder.Build();
var voiceStorageRootPath = (builder.Configuration["VoiceStorage:RootPath"] ?? "").Trim();

// Support running the API both directly (localhost:7125/api/...)
// and behind an IIS application mounted at /api.
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api", out var remaining))
    {
        context.Request.Path = remaining.HasValue ? remaining : "/";
    }

    await next();
});

app.UseSwagger();
app.UseSwaggerUI();
if (!string.IsNullOrWhiteSpace(voiceStorageRootPath))
{
    Directory.CreateDirectory(voiceStorageRootPath);
    var contentTypeProvider = new FileExtensionContentTypeProvider();
    contentTypeProvider.Mappings[".webm"] = "video/webm";
    contentTypeProvider.Mappings[".m4a"] = "audio/mp4";
    contentTypeProvider.Mappings[".mp3"] = "audio/mpeg";

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(voiceStorageRootPath),
        RequestPath = "/uploads/birthday-pray",
        ContentTypeProvider = contentTypeProvider
    });
}

app.UseStaticFiles();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto
});

app.UseCors("BC");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
