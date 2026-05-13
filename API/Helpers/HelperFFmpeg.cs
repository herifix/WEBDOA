using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace API.Helpers
{
    public class HelperFFmpeg
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public HelperFFmpeg(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
        }

        /// <summary>
        /// Mendapatkan path absolut ke executable FFmpeg.
        /// Menangani path relatif agar tetap valid setelah aplikasi di-deploy.
        /// </summary>
        public string GetFFmpegPath()
        {
            var binaryPath = _configuration["FFmpeg:BinaryPath"];
            
            if (string.IsNullOrWhiteSpace(binaryPath))
            {
                binaryPath = Path.Combine("tools", "ffmpeg", "bin", "ffmpeg.exe");
            }

            // Jika path sudah absolut, kembalikan langsung
            if (Path.IsPathRooted(binaryPath))
            {
                return binaryPath;
            }

            // Gabungkan dengan ContentRootPath agar relatif terhadap lokasi instalasi aplikasi
            return Path.Combine(_env.ContentRootPath, binaryPath);
        }

        /// <summary>
        /// Mendapatkan durasi timeout FFmpeg dalam detik.
        /// </summary>
        public int GetTimeoutSeconds()
        {
            var timeoutStr = _configuration["FFmpeg:TimeoutSeconds"];
            if (int.TryParse(timeoutStr, out int timeout))
            {
                return timeout;
            }
            return 60; // Default timeout
        }
    }
}
