using API.Repository.global;
using API.Service.Master;
using API.Service.Transaction;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//var server = builder.Configuration["DB_SERVER"];
//var db = builder.Configuration["DB_NAME"];
//var user = builder.Configuration["DB_USER"];
//var pass = builder.Configuration["DB_PASSWORD"];

//var connStr = $"Server={server};Database={db};User Id={user};Password={pass};";

// (Kalau masih pakai EF) - kalau fokus Dapper, ini bisa dihapus nanti
//builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connStr));


// ✅ Dapper connection
// DB Transaksi
builder.Services.AddScoped<IDbConnection>(sp =>
    new SqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ✅ Swagger + Bearer (gembok)
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

// ✅ CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("BC",
        policy =>
        {
            policy.WithOrigins("http://139.255.109.178","http://localhost:5174", "http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader();
        });
});

// ✅ JWT
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

// ✅ register repo dan service
builder.Services.AddScoped<RepoMasterItem>();
builder.Services.AddScoped<ServiceMasterItem>();
builder.Services.AddScoped<RepoMasterDonatur>();
builder.Services.AddScoped<ServiceMasterDonatur>();
builder.Services.AddScoped<ServiceMasterPendoa>();
builder.Services.AddScoped<RepoMasterPendoa>();
builder.Services.AddScoped<RepoMasterUser>();
builder.Services.AddScoped<RepoTRBirthdayPray>();
builder.Services.AddScoped<ServiceTRBirthdayPray>();
builder.Services.AddScoped<ServiceMasterUser>();

var app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI();
app.UseStaticFiles();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// ✅ CORS harus sebelum auth & endpoint
app.UseCors("BC");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
