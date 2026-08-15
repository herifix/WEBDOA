using System.Reflection;
using API.Repository.global;
using API.Service.Transaction;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Xunit;

namespace API.Tests;

public sealed class ServiceVoiceStorageTests : IDisposable
{
    private readonly string webRootPath = Path.Combine(Path.GetTempPath(), $"voice-storage-{Guid.NewGuid():N}");

    [Fact]
    public void SaveToLocalServer_FallsBackToWebRoot_WhenUncPathIsUnavailable()
    {
        Directory.CreateDirectory(webRootPath);
        var context = new DefaultHttpContext();
        context.Request.Scheme = "https";
        context.Request.Host = new HostString("voice-test.invalid");
        var service = new ServiceVoiceStorage(
            null!,
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["VoiceStorage:RootPath"] = @"\\missing-voice-share\birthday-pray",
                    ["VoiceStorage:EnvironmentFolder"] = "prod",
                    ["Runtime:PublicBaseUrl"] = "https://voice-test.invalid/api"
                })
                .Build(),
            null!,
            null!,
            new TestWebHostEnvironment(webRootPath),
            new HttpContextAccessor { HttpContext = context });
        using var input = new MemoryStream(new byte[] { 1, 2, 3 });
        var file = new FormFile(input, 0, input.Length, "audio", "doa.mp3")
        {
            Headers = new HeaderDictionary(),
            ContentType = "audio/mpeg"
        };
        var method = typeof(ServiceVoiceStorage).GetMethod("SaveToLocalServer", BindingFlags.Instance | BindingFlags.NonPublic);

        var saved = Assert.IsType<ResponseModelVoiceRecording>(method!.Invoke(service, new object[] { file }));

        Assert.True(File.Exists(saved.storagePath));
        Assert.StartsWith(Path.Combine(webRootPath, "uploads", "birthday-pray", "prod"), saved.storagePath, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("uploads/birthday-pray/prod", Path.GetDirectoryName(saved.objectName)?.Replace('\\', '/'));
    }

    public void Dispose()
    {
        if (Directory.Exists(webRootPath))
        {
            Directory.Delete(webRootPath, recursive: true);
        }
    }

    private sealed class TestWebHostEnvironment(string webRootPath) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "API.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = webRootPath;
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = webRootPath;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
