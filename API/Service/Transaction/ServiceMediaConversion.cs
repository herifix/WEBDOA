using API.Helpers;
using Microsoft.AspNetCore.Hosting;
using System.Diagnostics;

namespace API.Service.Transaction
{
    public class ServiceMediaConversion
    {
        private static readonly string[] SupportedLogoExtensions = [".png", ".jpg", ".jpeg", ".webp"];

        private readonly IConfiguration configuration;
        private readonly IWebHostEnvironment env;
        private readonly HelperFFmpeg ffmpegHelper;

        public ServiceMediaConversion(
            IConfiguration configuration,
            IWebHostEnvironment env,
            HelperFFmpeg ffmpegHelper)
        {
            this.configuration = configuration;
            this.env = env;
            this.ffmpegHelper = ffmpegHelper;
        }

        public void ConvertAudioToMp4WithPtLogo(string sourceAudioPath, string outputMp4Path, string ptCode)
        {
            string logoPath = ResolvePtLogoPath(ptCode);
            Directory.CreateDirectory(Path.GetDirectoryName(outputMp4Path) ?? Path.GetTempPath());

            int outputWidth = GetConfiguredPositiveInt("MediaConversion:OutputWidth", 1280);
            int outputHeight = GetConfiguredPositiveInt("MediaConversion:OutputHeight", 720);
            string ffmpegPath = ffmpegHelper.GetFFmpegPath();
            int timeoutSeconds = ffmpegHelper.GetTimeoutSeconds();
            string videoFilter =
                $"scale={outputWidth}:{outputHeight}:force_original_aspect_ratio=decrease," +
                $"pad={outputWidth}:{outputHeight}:(ow-iw)/2:(oh-ih)/2:color=0x04392f,setsar=1";

            using var process = new Process();
            process.StartInfo = new ProcessStartInfo
            {
                FileName = ffmpegPath,
                UseShellExecute = false,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            };

            process.StartInfo.ArgumentList.Add("-y");
            process.StartInfo.ArgumentList.Add("-loop");
            process.StartInfo.ArgumentList.Add("1");
            process.StartInfo.ArgumentList.Add("-framerate");
            process.StartInfo.ArgumentList.Add("1");
            process.StartInfo.ArgumentList.Add("-i");
            process.StartInfo.ArgumentList.Add(logoPath);
            process.StartInfo.ArgumentList.Add("-i");
            process.StartInfo.ArgumentList.Add(sourceAudioPath);
            process.StartInfo.ArgumentList.Add("-map");
            process.StartInfo.ArgumentList.Add("0:v:0");
            process.StartInfo.ArgumentList.Add("-map");
            process.StartInfo.ArgumentList.Add("1:a:0");
            process.StartInfo.ArgumentList.Add("-vf");
            process.StartInfo.ArgumentList.Add(videoFilter);
            process.StartInfo.ArgumentList.Add("-c:v");
            process.StartInfo.ArgumentList.Add("libx264");
            process.StartInfo.ArgumentList.Add("-tune");
            process.StartInfo.ArgumentList.Add("stillimage");
            process.StartInfo.ArgumentList.Add("-pix_fmt");
            process.StartInfo.ArgumentList.Add("yuv420p");
            process.StartInfo.ArgumentList.Add("-c:a");
            process.StartInfo.ArgumentList.Add("aac");
            process.StartInfo.ArgumentList.Add("-b:a");
            process.StartInfo.ArgumentList.Add("128k");
            process.StartInfo.ArgumentList.Add("-ar");
            process.StartInfo.ArgumentList.Add("44100");
            process.StartInfo.ArgumentList.Add("-shortest");
            process.StartInfo.ArgumentList.Add("-movflags");
            process.StartInfo.ArgumentList.Add("+faststart");
            process.StartInfo.ArgumentList.Add(outputMp4Path);

            try
            {
                process.Start();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Gagal menjalankan FFmpeg. Pastikan FFmpeg sudah ter-install atau set konfigurasi FFmpeg:BinaryPath. Detail: {ex.Message}",
                    ex);
            }

            Task<string> stderrTask = process.StandardError.ReadToEndAsync();
            Task<string> stdoutTask = process.StandardOutput.ReadToEndAsync();

            if (!process.WaitForExit(timeoutSeconds * 1000))
            {
                try
                {
                    process.Kill(true);
                }
                catch
                {
                    // ignore kill failure
                }

                throw new TimeoutException($"Proses konversi MP4 FFmpeg melebihi batas waktu {timeoutSeconds} detik.");
            }

            string stderr = stderrTask.GetAwaiter().GetResult();
            string stdout = stdoutTask.GetAwaiter().GetResult();

            if (process.ExitCode != 0 || !File.Exists(outputMp4Path) || new FileInfo(outputMp4Path).Length <= 0)
            {
                string errorMessage = string.IsNullOrWhiteSpace(stderr) ? stdout : stderr;
                throw new InvalidOperationException($"Gagal konversi rekaman ke MP4 menggunakan FFmpeg. {TrimForErrorMessage(errorMessage)}");
            }
        }

        private string ResolvePtLogoPath(string ptCode)
        {
            string normalizedPt = SanitizeFileName((ptCode ?? "").Trim());
            foreach (string rootPath in BuildLogoRootCandidates())
            {
                if (string.IsNullOrWhiteSpace(rootPath) || !Directory.Exists(rootPath))
                {
                    continue;
                }

                foreach (string fileName in BuildLogoFileNameCandidates(normalizedPt))
                {
                    string candidatePath = Path.Combine(rootPath, fileName);
                    if (File.Exists(candidatePath))
                    {
                        return candidatePath;
                    }

                    string? caseInsensitiveMatch = Directory
                        .EnumerateFiles(rootPath)
                        .FirstOrDefault(file => string.Equals(
                            Path.GetFileName(file),
                            fileName,
                            StringComparison.OrdinalIgnoreCase));

                    if (!string.IsNullOrWhiteSpace(caseInsensitiveMatch))
                    {
                        return caseInsensitiveMatch;
                    }
                }
            }

            string defaultLogoPath = ResolveConfiguredPath(configuration["MediaConversion:DefaultLogoPath"]);
            if (!string.IsNullOrWhiteSpace(defaultLogoPath) && File.Exists(defaultLogoPath))
            {
                return defaultLogoPath;
            }

            string ptHint = string.IsNullOrWhiteSpace(ptCode) ? "(kosong)" : ptCode;
            throw new InvalidOperationException(
                $"Logo PT untuk cover MP4 tidak ditemukan. PT: {ptHint}. " +
                "Atur `MediaConversion:PtLogoRootPath` atau `MediaConversion:DefaultLogoPath` di appsettings.");
        }

        private IEnumerable<string> BuildLogoRootCandidates()
        {
            foreach (var configuredRoot in SplitConfiguredPaths(configuration["MediaConversion:PtLogoRootPath"]))
            {
                yield return configuredRoot;
            }

            yield return ResolveConfiguredPath(Path.Combine("wwwroot", "pt"));
            yield return ResolveConfiguredPath(Path.Combine("wwwroot", "assets"));
            yield return ResolveConfiguredPath(Path.Combine("..", "client", "public", "pt"));
            yield return ResolveConfiguredPath(Path.Combine("..", "client", "src", "assets"));
        }

        private IEnumerable<string> BuildLogoFileNameCandidates(string normalizedPt)
        {
            if (!string.IsNullOrWhiteSpace(normalizedPt))
            {
                foreach (string extension in SupportedLogoExtensions)
                {
                    yield return $"{normalizedPt}{extension}";
                    yield return $"LOGO{normalizedPt}{extension}";
                    yield return $"logo{normalizedPt}{extension}";
                }
            }
        }

        private IEnumerable<string> SplitConfiguredPaths(string? configuredValue)
        {
            if (string.IsNullOrWhiteSpace(configuredValue))
            {
                yield break;
            }

            foreach (string item in configuredValue.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                string resolved = ResolveConfiguredPath(item);
                if (!string.IsNullOrWhiteSpace(resolved))
                {
                    yield return resolved;
                }
            }
        }

        private string ResolveConfiguredPath(string? configuredPath)
        {
            string value = (configuredPath ?? "").Trim();
            if (string.IsNullOrWhiteSpace(value))
            {
                return "";
            }

            if (Path.IsPathRooted(value))
            {
                return value;
            }

            return Path.GetFullPath(Path.Combine(env.ContentRootPath, value));
        }

        private int GetConfiguredPositiveInt(string key, int fallback)
        {
            return int.TryParse(configuration[key], out int value) && value > 0 ? value : fallback;
        }

        private string SanitizeFileName(string value)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            string safe = new string(value.Where(c => !invalidChars.Contains(c)).ToArray()).Trim();
            return safe.Replace(" ", "_");
        }

        private string TrimForErrorMessage(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "";
            }

            value = value.Trim();
            return value.Length <= 1000 ? value : value[^1000..];
        }
    }
}
