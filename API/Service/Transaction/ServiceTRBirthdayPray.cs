using API.Repository.global;
using API.Repository.Master;
using API.Repository.Transaction;
using Azure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json.Linq;
using System;
using System.Data;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace API.Service.Transaction
{
    public class ServiceTRBirthdayPray
    {
        private readonly IDbConnection conn;
        private readonly RepoTRBirthdayPray repo;
        private readonly RepoMasterDonatur donaturRepo;
        private readonly RepoApplicationSetting settingRepo;
        private readonly ServiceVoiceStorage voiceStorageService;
        private readonly ServiceMediaConversion mediaConversionService;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly IWebHostEnvironment env;
        private readonly IConfiguration configuration;

        public ServiceTRBirthdayPray(
            IDbConnection conn,
            RepoTRBirthdayPray repo,
            RepoMasterDonatur donaturRepo,
            RepoApplicationSetting settingRepo,
            ServiceVoiceStorage voiceStorageService,
            ServiceMediaConversion mediaConversionService,
            IHttpContextAccessor httpContextAccessor,
            IWebHostEnvironment env,
            IConfiguration configuration)
        {
            this.conn = conn;
            this.repo = repo;
            this.donaturRepo = donaturRepo;
            this.settingRepo = settingRepo;
            this.voiceStorageService = voiceStorageService;
            this.mediaConversionService = mediaConversionService;
            this.httpContextAccessor = httpContextAccessor;
            this.env = env;
            this.configuration = configuration;
        }

        public ResponseData<List<ResponseModelDashboardBirthday>> GetUpcomingBirthdayDashboard(DateTime currentDate)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return new ResponseData<List<ResponseModelDashboardBirthday>>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetUpcomingBirthdayDashboard(currentDate.Date, conn)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<List<ResponseModelDashboardBirthday>>
                {
                    success = false,
                    message = ex.Message,
                    data = new List<ResponseModelDashboardBirthday>()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<List<ResponseModelDashboardBirthday>> GetUpcomingBirthdayByDate(DateTime targetDate)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return new ResponseData<List<ResponseModelDashboardBirthday>>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetUpcomingBirthdayByDate(targetDate.Date, conn)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<List<ResponseModelDashboardBirthday>>
                {
                    success = false,
                    message = ex.Message,
                    data = new List<ResponseModelDashboardBirthday>()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<List<ResponseModelTRBirthdayPrayDateStatus>> GetDateStatuses()
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return new ResponseData<List<ResponseModelTRBirthdayPrayDateStatus>>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetDateStatuses( conn)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<List<ResponseModelTRBirthdayPrayDateStatus>>
                {
                    success = false,
                    message = ex.Message,
                    data = new List<ResponseModelTRBirthdayPrayDateStatus>()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<ResponseModelTRBirthdayPray> GetDataByDonatur(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;

            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                var response = repo.GetDataByDonaturId(idDonatur, targetYear, conn);
                if (response.success && response.data != null)
                {
                    response.data.pathPesanSuaraUrl = ResolveStoredAudioPreviewUrl(response.data.pathPesanSuara);
                }

                return response;
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelTRBirthdayPray>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelTRBirthdayPray()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<List<ResponseModelTRBirthdayPrayHistory>> GetHistoryByDonatur(long idDonatur)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                var history = repo.GetHistoryByDonaturId(idDonatur, conn);
                foreach (var item in history)
                {
                    item.pathPesanSuaraUrl = ResolveStoredAudioPreviewUrl(item.pathPesanSuara);
                }

                return new ResponseData<List<ResponseModelTRBirthdayPrayHistory>>
                {
                    success = true,
                    message = "OK",
                    data = history
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<List<ResponseModelTRBirthdayPrayHistory>>
                {
                    success = false,
                    message = ex.Message,
                    data = new List<ResponseModelTRBirthdayPrayHistory>()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<ResponseModelTRBirthdayPrayMediaDebug> GetMediaDebugInfo(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;

            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || prayData.id_donatur <= 0)
                {
                    return new ResponseData<ResponseModelTRBirthdayPrayMediaDebug>
                    {
                        success = false,
                        message = "Data birthday pray tidak ditemukan.",
                        data = new ResponseModelTRBirthdayPrayMediaDebug()
                    };
                }

                string publicBaseUrl = GetPublicBaseUrl();
                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string effectiveStorageProvider = GetEffectiveVoiceStorageProvider(conn);
                string resolvedUrl = ResolveStoredAudioDeliveryUrl(prayData.pathPesanSuara);
                bool requiresPublicBaseUrl = StoredAudioRequiresPublicBaseUrl(prayData.pathPesanSuara);
                (bool isValid, string message) publicBaseUrlValidation = requiresPublicBaseUrl
                    ? ValidatePublicBaseUrl(publicBaseUrl)
                    : (true, "URL audio akan di-resolve dari Google Cloud Storage.");

                return new ResponseData<ResponseModelTRBirthdayPrayMediaDebug>
                {
                    success = true,
                    message = "OK",
                    data = new ResponseModelTRBirthdayPrayMediaDebug
                    {
                        id_donatur = prayData.id_donatur,
                        targetYear = targetYear,
                        publicBaseUrl = publicBaseUrl,
                        gatewayUrl = gatewayUrl,
                        voiceStorageProvider = effectiveStorageProvider,
                        voiceStorageRootPath = GetVoiceStorageRootPath(),
                        voiceStorageEnvironmentFolder = GetVoiceStorageEnvironmentFolder(),
                        pathPesanSuara = prayData.pathPesanSuara ?? "",
                        pathPesanSuaraUrl = ResolveStoredAudioPreviewUrl(prayData.pathPesanSuara),
                        audioUrl = resolvedUrl,
                        hasAudioFile = !string.IsNullOrWhiteSpace(prayData.pathPesanSuara),
                        isPublicBaseUrlConfigured = !string.IsNullOrWhiteSpace(publicBaseUrl),
                        isPublicBaseUrlLikelyPublic = publicBaseUrlValidation.isValid,
                        publicBaseUrlValidationMessage = publicBaseUrlValidation.message
                    }
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelTRBirthdayPrayMediaDebug>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelTRBirthdayPrayMediaDebug()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<long> SaveVoiceFFmpeg(RequestSaveTRBirthdayPrayVoice bodyRequest)
        {
            var response = new ResponseData<long> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                if (bodyRequest.idDonatur <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Data donatur tidak valid.",
                        data = 0
                    };
                }

                if (bodyRequest.pesanSuaraFile == null || bodyRequest.pesanSuaraFile.Length <= 0)
                    {
                        if (bodyRequest.voiceRecordingId.HasValue && bodyRequest.voiceRecordingId.Value > 0)
                            {
                                // already handled below
                            }
                        else
                            {
        tran.Rollback();
                                return new ResponseData<long>
                                {
            success = false,
message = "File pesan suara wajib diisi.",
data = 0
                        }
        ;
                            }
                    }

                if (bodyRequest.pesanSuaraFile != null && bodyRequest.pesanSuaraFile.Length > 0)
                    {
                        if (!IsSupportedAudioFileForFFmpeg(bodyRequest.pesanSuaraFile))
                            {
        tran.Rollback();
                                return new ResponseData<long>
                                {
            success = false,
message = "File pesan suara harus berupa audio yang didukung FFmpeg (.mp3, .wav, .m4a, .aac, .ogg, .oga, .webm, .opus, .flac, .amr).",
data = 0
                        }
        ;
                            }
                    }

var donaturResponse = donaturRepo.GetDataById(bodyRequest.idDonatur, conn, tran);
var donatur = donaturResponse.data;

                if (!donaturResponse.success || donatur == null || donatur.id_donatur == 0 || !donatur.TglLahir.HasValue)
                    {
    tran.Rollback();
                        return new ResponseData<long>
                        {
        success = false,
message = "Data donatur tidak ditemukan.",
data = 0
                    }
    ;
                    }

var defaultPendoa = repo.GetDefaultPendoa(conn, tran);
                if (defaultPendoa == null || defaultPendoa.id_pendoa <= 0)
                    {
    tran.Rollback();
                        return new ResponseData<long>
                        {
        success = false,
message = "Pendoa default belum tersedia.",
data = 0
                    }
    ;
                    }

int targetYear = DateTime.Today.Year;
DateTime birthdayDate = BuildBirthdayDate(donatur.TglLahir.Value, targetYear);
var targetDonaturs = bodyRequest.saveToAllSameBirthdayDate
                    ? repo.GetDonatursByBirthdayDate(birthdayDate, conn, tran)
                    : new List<ResponseModeMasterDonatur> { donatur };

                if (targetDonaturs.Count == 0)
                    {
    targetDonaturs.Add(donatur);
                    }

string pathPesanSuara = "";
                if (bodyRequest.voiceRecordingId.HasValue && bodyRequest.voiceRecordingId.Value > 0)
                    {
    pathPesanSuara = voiceStorageService.ResolvePlaybackUrl(bodyRequest.voiceRecordingId.Value, conn, tran).url;
                    }
                else
                    {
    pathPesanSuara = SaveVoiceFileUsingFFmpeg(bodyRequest.pesanSuaraFile!, tran);
                    }

                foreach (var targetDonatur in targetDonaturs)
                    {
                        if (targetDonatur == null || targetDonatur.id_donatur == 0 || !targetDonatur.TglLahir.HasValue)
                            {
                                continue;
                            }
    
    DateTime targetBirthdayDate = BuildBirthdayDate(targetDonatur.TglLahir.Value, targetYear);
    var targetExisting = repo.GetDataByDonaturId(targetDonatur.id_donatur, targetYear, conn, tran).data;
    
                        if (targetExisting != null && targetExisting.id_TRBirthdayPray > 0)
                            {
        repo.UpdateVoicePath(targetExisting.id_TRBirthdayPray, pathPesanSuara, conn, tran);
        response.data = targetExisting.id_TRBirthdayPray;
                            }
                        else
                            {
        response.data = repo.Create(
        new RequestSaveTRBirthdayPray
                                    {
            idDonatur = targetDonatur.id_donatur,
idTRBirthdayPray = bodyRequest.idTRBirthdayPray,
pesan = "",
pesanSuaraFile = null,
voiceRecordingId = bodyRequest.voiceRecordingId,
saveToAllSameBirthdayDate = bodyRequest.saveToAllSameBirthdayDate
                            },
targetDonatur,
defaultPendoa,
targetBirthdayDate,
pathPesanSuara,
conn,
tran
                        );
                            }
                    }

response.message = bodyRequest.saveToAllSameBirthdayDate
                    ? "Pesan suara berhasil dikonversi dengan FFmpeg dan disimpan untuk semua donatur dengan tanggal ulang tahun yang sama."
                    : "Pesan suara berhasil dikonversi dengan FFmpeg dan disimpan.";

tran.Commit();
response.success = true;
                return response;
            }
            catch (Exception ex)
            {
                tran.Rollback();

                return new ResponseData<long>
                {
    success = false,
message = ex.Message,
data = 0
                }
;
            }
            finally
            {
                    if (conn.State == ConnectionState.Open)
        conn.Close();
                }
        }

        private string SaveVoiceFileUsingFFmpeg(IFormFile file, IDbTransaction tran)
        {
            string tempFolder = Path.Combine(Path.GetTempPath(), "birthday-pray-ffmpeg");
            Directory.CreateDirectory(tempFolder);

            string sourceExtension = Path.GetExtension(file.FileName ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(sourceExtension))
            {
                sourceExtension = ".tmp";
            }

            string tempSourcePath = Path.Combine(tempFolder, $"{Guid.NewGuid():N}{sourceExtension}");
            string tempMp3Path = Path.Combine(tempFolder, $"{Guid.NewGuid():N}.mp3");

            try
            {
                using (var sourceStream = new FileStream(tempSourcePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                {
                    file.CopyTo(sourceStream);
                }

ConvertAudioToMp3WithFFmpeg(tempSourcePath, tempMp3Path);

                using var mp3Stream = new FileStream(tempMp3Path, FileMode.Open, FileAccess.Read, FileShare.Read);
var convertedFile = new FormFile(mp3Stream, 0, mp3Stream.Length, "audio", BuildConvertedMp3FileName(file.FileName))
                {
    Headers = new HeaderDictionary(),
ContentType = "audio/mpeg"
                }
;

                return SaveVoiceFile(convertedFile, tran);
            }
            finally
            {
    TryDeleteFile(tempSourcePath);
    TryDeleteFile(tempMp3Path);
                }
        }

        private void ConvertAudioToMp3WithFFmpeg(string sourcePath, string outputMp3Path)
        {
    string ffmpegBinaryPath = (configuration["FFmpeg:BinaryPath"] ?? "ffmpeg").Trim();
                if (string.IsNullOrWhiteSpace(ffmpegBinaryPath))
                    {
        ffmpegBinaryPath = "ffmpeg";
                    }
    
    int timeoutSeconds = 60;
                if (int.TryParse(configuration["FFmpeg:TimeoutSeconds"], out int configuredTimeoutSeconds) && configuredTimeoutSeconds > 0)
                    {
        timeoutSeconds = configuredTimeoutSeconds;
                    }
    
                using var process = new Process();
    process.StartInfo = new ProcessStartInfo
                {
        FileName = ffmpegBinaryPath,
UseShellExecute = false,
RedirectStandardError = true,
RedirectStandardOutput = true,
CreateNoWindow = true
            }
    ;
    
    process.StartInfo.ArgumentList.Add("-y");
    process.StartInfo.ArgumentList.Add("-i");
    process.StartInfo.ArgumentList.Add(sourcePath);
    process.StartInfo.ArgumentList.Add("-vn");
    process.StartInfo.ArgumentList.Add("-acodec");
    process.StartInfo.ArgumentList.Add("libmp3lame");
    process.StartInfo.ArgumentList.Add("-ar");
    process.StartInfo.ArgumentList.Add("44100");
    process.StartInfo.ArgumentList.Add("-ac");
    process.StartInfo.ArgumentList.Add("2");
    process.StartInfo.ArgumentList.Add("-b:a");
    process.StartInfo.ArgumentList.Add("128k");
    process.StartInfo.ArgumentList.Add(outputMp3Path);
    
                try
            {
        process.Start();
                    }
                catch (Exception ex)
            {
        throw new InvalidOperationException($"Gagal menjalankan FFmpeg. Pastikan FFmpeg sudah ter-install atau set konfigurasi FFmpeg:BinaryPath. Detail: {ex.Message}", ex);
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
        
        throw new TimeoutException($"Proses konversi audio FFmpeg melebihi batas waktu {timeoutSeconds} detik.");
                    }
        
        string stderr = stderrTask.GetAwaiter().GetResult();
        string stdout = stdoutTask.GetAwaiter().GetResult();
        
                    if (process.ExitCode != 0 || !File.Exists(outputMp3Path) || new FileInfo(outputMp3Path).Length <= 0)
                        {
            string errorMessage = string.IsNullOrWhiteSpace(stderr) ? stdout : stderr;
            throw new InvalidOperationException($"Gagal konversi audio ke MP3 menggunakan FFmpeg. {TrimForErrorMessage(errorMessage)}");
                        }
                }
    
            private bool IsSupportedAudioFileForFFmpeg(IFormFile file)
        {
    string extension = Path.GetExtension(file.FileName ?? "").Trim().ToLowerInvariant();
    var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
        ".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".webm", ".opus", ".flac", ".amr"
                    }
    ;
    
                return allowedExtensions.Contains(extension);
            }

        private string BuildConvertedMp3FileName(string originalFileName)
        {
    string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName ?? "");
                if (string.IsNullOrWhiteSpace(fileNameWithoutExtension))
                    {
        fileNameWithoutExtension = "pesan-suara";
                    }
    
                return $"{SanitizeFileName(fileNameWithoutExtension)}.mp3";
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

        private void TryDeleteFile(string filePath)
        {
                try
            {
                        if (!string.IsNullOrWhiteSpace(filePath) && File.Exists(filePath))
                            {
            File.Delete(filePath);
                            }
                    }
                catch
            {
                        // ignore cleanup failure
                    }
            }


        public ResponseData<long> Save(RequestSaveTRBirthdayPray bodyRequest)
        {
            var response = new ResponseData<long> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                if (bodyRequest.idDonatur <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Data donatur tidak valid.",
                        data = 0
                    };
                }

                //if (bodyRequest.pesan == "-") { bodyRequest.pesan = ""; }

                var donaturResponse = donaturRepo.GetDataById(bodyRequest.idDonatur, conn, tran);
                var donatur = donaturResponse.data;

                if (!donaturResponse.success || donatur == null || donatur.id_donatur == 0 || !donatur.TglLahir.HasValue)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Data donatur tidak ditemukan.",
                        data = 0
                    };
                }

                var defaultPendoa = repo.GetDefaultPendoa(conn, tran);
                if (defaultPendoa == null || defaultPendoa.id_pendoa <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Pendoa default belum tersedia.",
                        data = 0
                    };
                }

                int targetYear = DateTime.Today.Year;
                DateTime birthdayDate = BuildBirthdayDate(donatur.TglLahir.Value, targetYear);
                var targetDonaturs = bodyRequest.saveToAllSameBirthdayDate
                    ? repo.GetDonatursByBirthdayDate(birthdayDate, conn, tran)
                    : new List<ResponseModeMasterDonatur> { donatur };

                if (targetDonaturs.Count == 0)
                {
                    targetDonaturs.Add(donatur);
                }

                var existing = repo.GetDataByDonaturId(bodyRequest.idDonatur, targetYear, conn, tran).data;
                string pathPesanSuara = existing?.pathPesanSuara ?? "";
                if (bodyRequest.voiceRecordingId.HasValue && bodyRequest.voiceRecordingId.Value > 0)
                {
                    pathPesanSuara = voiceStorageService.ResolvePlaybackUrl(bodyRequest.voiceRecordingId.Value, conn, tran).url;
                }

                if (bodyRequest.pesanSuaraFile != null && bodyRequest.pesanSuaraFile.Length > 0)
                {
                    if (!IsSupportedAudioFile(bodyRequest.pesanSuaraFile))
                    {
                        tran.Rollback();
                        return new ResponseData<long>
                        {
                            success = false,
                            message = "File pesan suara harus berformat MP3 atau MP4.",
                            data = 0
                        };
                    }

                    pathPesanSuara = SaveVoiceFile(bodyRequest.pesanSuaraFile ,tran);
                }

                foreach (var targetDonatur in targetDonaturs)
                {
                    if (targetDonatur == null || targetDonatur.id_donatur == 0 || !targetDonatur.TglLahir.HasValue)
                    {
                        continue;
                    }

                    DateTime targetBirthdayDate = BuildBirthdayDate(targetDonatur.TglLahir.Value, targetYear);
                    var targetExisting = repo.GetDataByDonaturId(targetDonatur.id_donatur, targetYear, conn, tran).data;
                    bool isCurrentDonatur = targetDonatur.id_donatur == bodyRequest.idDonatur;
                    string targetPathPesanSuara = isCurrentDonatur
                        ? pathPesanSuara
                        : (targetExisting?.pathPesanSuara ?? "");

                    if (targetExisting != null && targetExisting.id_TRBirthdayPray > 0)
                    {
                        repo.Update(
                            targetExisting.id_TRBirthdayPray,
                            bodyRequest.pesan ?? "",
                            targetPathPesanSuara,
                            conn,
                            tran
                        );
                        response.data = targetExisting.id_TRBirthdayPray;
                    }
                    else
                    {
                        response.data = repo.Create(
                            bodyRequest,
                            targetDonatur,
                            defaultPendoa,
                            targetBirthdayDate,
                            targetPathPesanSuara,
                            conn,
                            tran
                        );
                    }
                }

                response.message = bodyRequest.saveToAllSameBirthdayDate
                    ? "TRBirthdayPray saved for all donatur with the same birthday date."
                    : "TRBirthdayPray saved successfully.";

                tran.Commit();
                response.success = true;
                return response;
            }
            catch (Exception ex)
            {
                tran.Rollback();

                return new ResponseData<long>
                {
                    success = false,
                    message = ex.Message,
                    data = 0
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<long> SaveVoice(RequestSaveTRBirthdayPrayVoice bodyRequest)
        {
            var response = new ResponseData<long> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                if (bodyRequest.idDonatur <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Data donatur tidak valid.",
                        data = 0
                    };
                }

                if (bodyRequest.pesanSuaraFile == null || bodyRequest.pesanSuaraFile.Length <= 0)
                {
                    if (bodyRequest.voiceRecordingId.HasValue && bodyRequest.voiceRecordingId.Value > 0)
                    {
                        // already handled below
                    }
                    else
                    {
                        tran.Rollback();
                        return new ResponseData<long>
                        {
                            success = false,
                            message = "File pesan suara wajib diisi.",
                            data = 0
                        };
                    }
                }

                if (bodyRequest.pesanSuaraFile != null && bodyRequest.pesanSuaraFile.Length > 0)
                {
                    if (!IsSupportedAudioFile(bodyRequest.pesanSuaraFile))
                    {
                        tran.Rollback();
                        return new ResponseData<long>
                        {
                            success = false,
                            message = "File pesan suara harus berformat MP3 atau MP4.",
                            data = 0
                        };
                    }
                }

                var donaturResponse = donaturRepo.GetDataById(bodyRequest.idDonatur, conn, tran);
                var donatur = donaturResponse.data;

                if (!donaturResponse.success || donatur == null || donatur.id_donatur == 0 || !donatur.TglLahir.HasValue)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Data donatur tidak ditemukan.",
                        data = 0
                    };
                }

                var defaultPendoa = repo.GetDefaultPendoa(conn, tran);
                if (defaultPendoa == null || defaultPendoa.id_pendoa <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Pendoa default belum tersedia.",
                        data = 0
                    };
                }

                int targetYear = DateTime.Today.Year;
                DateTime birthdayDate = BuildBirthdayDate(donatur.TglLahir.Value, targetYear);
                var targetDonaturs = bodyRequest.saveToAllSameBirthdayDate
                    ? repo.GetDonatursByBirthdayDate(birthdayDate, conn, tran)
                    : new List<ResponseModeMasterDonatur> { donatur };

                if (targetDonaturs.Count == 0)
                {
                    targetDonaturs.Add(donatur);
                }

                string pathPesanSuara = "";
                if (bodyRequest.voiceRecordingId.HasValue && bodyRequest.voiceRecordingId.Value > 0)
                {
                    pathPesanSuara = voiceStorageService.ResolvePlaybackUrl(bodyRequest.voiceRecordingId.Value, conn, tran).url;
                }
                else
                {
                    pathPesanSuara = SaveVoiceFile(bodyRequest.pesanSuaraFile!, tran);
                }

                foreach (var targetDonatur in targetDonaturs)
                {
                    if (targetDonatur == null || targetDonatur.id_donatur == 0 || !targetDonatur.TglLahir.HasValue)
                    {
                        continue;
                    }

                    DateTime targetBirthdayDate = BuildBirthdayDate(targetDonatur.TglLahir.Value, targetYear);
                    var targetExisting = repo.GetDataByDonaturId(targetDonatur.id_donatur, targetYear, conn, tran).data;

                    if (targetExisting != null && targetExisting.id_TRBirthdayPray > 0)
                    {
                        repo.UpdateVoicePath(targetExisting.id_TRBirthdayPray, pathPesanSuara, conn, tran);
                        response.data = targetExisting.id_TRBirthdayPray;
                    }
                    else
                    {
                        response.data = repo.Create(
                            new RequestSaveTRBirthdayPray
                            {
                                idDonatur = targetDonatur.id_donatur,
                                idTRBirthdayPray = bodyRequest.idTRBirthdayPray,
                                pesan = "",
                                pesanSuaraFile = null,
                                voiceRecordingId = bodyRequest.voiceRecordingId,
                                saveToAllSameBirthdayDate = bodyRequest.saveToAllSameBirthdayDate
                            },
                            targetDonatur,
                            defaultPendoa,
                            targetBirthdayDate,
                            pathPesanSuara,
                            conn,
                            tran
                        );
                    }
                }

                response.message = bodyRequest.saveToAllSameBirthdayDate
                    ? "Pesan suara berhasil disimpan untuk semua donatur dengan tanggal ulang tahun yang sama."
                    : "Pesan suara berhasil disimpan.";

                tran.Commit();
                response.success = true;
                return response;
            }
            catch (Exception ex)
            {
                tran.Rollback();

                return new ResponseData<long>
                {
                    success = false,
                    message = ex.Message,
                    data = 0
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public async Task<ResponseData<object>> SendWhatsApp(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;

            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                var setting = settingRepo.GetSetting(conn);
                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;

                if (prayData == null || prayData.id_donatur <= 0)
                {
                    return new ResponseData<object> { success = false, message = "Data birthday pray tidak ditemukan." };
                }

                if (string.IsNullOrWhiteSpace(prayData.noHPDonatur))
                {
                    return new ResponseData<object> { success = false, message = "Nomor HP donatur tidak tersedia." };
                }

                if (string.IsNullOrWhiteSpace(prayData.pathPesanSuara))
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = "Rekaman audio belum tersedia. Simpan pesan suara terlebih dahulu sebelum kirim WhatsApp."
                    };
                }

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = ResolveGatewayToken(setting.whatsappGatewayToken);
                string publicBaseUrl = GetPublicBaseUrl();

                if (string.IsNullOrWhiteSpace(gatewayUrl))
                {
                    return new ResponseData<object> { success = false, message = "WhatsApp gateway URL belum diatur." };
                }

                string effectiveTemplateLink = await EnsureWhatsAppMp4VoiceAsync(prayData);
                bool requiresPublicBaseUrl = StoredAudioRequiresPublicBaseUrl(prayData.pathPesanSuara);

                if (requiresPublicBaseUrl && string.IsNullOrWhiteSpace(publicBaseUrl))
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = "Runtime.PublicBaseUrl belum diatur untuk mengirim pesan suara."
                    };
                }

                if (requiresPublicBaseUrl)
                {
                    var publicBaseUrlValidation = ValidatePublicBaseUrl(publicBaseUrl);
                    if (!publicBaseUrlValidation.isValid)
                    {
                        return new ResponseData<object>
                        {
                            success = false,
                            message = $"Runtime.PublicBaseUrl belum bisa diakses public untuk gateway pihak ketiga. {publicBaseUrlValidation.message}"
                        };
                    }
                }

                if (string.IsNullOrWhiteSpace(effectiveTemplateLink))
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = "URL rekaman audio belum valid untuk dikirim. Periksa konfigurasi Runtime.PublicBaseUrl atau data file audio."
                    };
                }

                string templateName = setting.whatsappTemplateName;
                if (string.IsNullOrWhiteSpace(templateName))
                {
                    templateName = "birthday_pray"; // Default fallback
                }

                var templateValidation = ValidateWhatsAppTemplateParameters(
                    templateName,
                    prayData.namaDonatur,
                    prayData.namaPendoa,
                    effectiveTemplateLink,
                    prayData.pesan
                );

                if (!templateValidation.success)
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = templateValidation.message
                    };
                }

                // Format phone number to E.164 (remove +, -, spaces, ensure starts with 62)
                string phoneNumber = prayData.noHPDonatur.Replace("+", "").Replace("-", "").Replace(" ", "");
                if (phoneNumber.StartsWith("0"))
                {
                    phoneNumber = "62" + phoneNumber.Substring(1);
                }
                else if (!phoneNumber.StartsWith("62"))
                {
                    phoneNumber = "62" + phoneNumber;
                }

                string headerImageUrl = "";
                if (!string.IsNullOrWhiteSpace(setting.msgImage))
                {
                    headerImageUrl = BuildAbsoluteUrl(publicBaseUrl, setting.msgImage);
                }

                var templateNameCandidates = BuildTemplateNameCandidates(templateName);
                var templateLanguageCandidates = BuildTemplateLanguageCandidates(GetConfiguredTemplateLanguageCode());

                using var httpClient = new HttpClient();
                if (!string.IsNullOrWhiteSpace(gatewayToken))
                {
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", gatewayToken);
                }

                var templateLookup = await TryGetGatewayTemplateCatalogAsync(httpClient, gatewayUrl);
                var availableApprovedTemplateHints = new List<string>();
                if (templateLookup.success)
                {
                    availableApprovedTemplateHints = BuildTemplateHints(templateLookup.approvedTemplates, 12);
                    var matchedApprovedTemplates = templateLookup.approvedTemplates
                        .Where(item => TemplateNameMatches(item.templateName, templateNameCandidates))
                        .ToList();

                    foreach (var matchedTemplate in matchedApprovedTemplates)
                    {
                        AddUnique(templateNameCandidates, matchedTemplate.templateName);
                        AddUnique(templateLanguageCandidates, matchedTemplate.languageCode);
                    }
                }

                HttpStatusCode latestStatusCode = HttpStatusCode.BadRequest;
                string latestResponseBody = "";
                string usedTemplateName = "";
                string usedLanguageCode = "";
                var attemptedCombinations = new List<string>();

                foreach (var candidateTemplateName in templateNameCandidates)
                {
                    foreach (var candidateLanguageCode in templateLanguageCandidates)
                    {
                        var matchedTemplateInfo = TryGetTemplateInfo(
                            templateLookup.approvedTemplates,
                            candidateTemplateName,
                            candidateLanguageCode);
                        int bodyVariableCount = matchedTemplateInfo?.bodyVariableCount ?? 4;
                        bool includeHeader = ShouldIncludeHeaderForTemplate(matchedTemplateInfo, headerImageUrl);

                        attemptedCombinations.Add(
                            $"{candidateTemplateName}:{candidateLanguageCode}" +
                            (includeHeader ? " [header]" : " [no-header]"));

                        var payload = new
                        {
                            phone_number = phoneNumber,
                            channel = "whatsapp",
                            message_type = "template",
                            template = new
                            {
                                name = candidateTemplateName,
                                language = new { code = candidateLanguageCode },
                                components = BuildTemplateComponents(
                                    includeHeader,
                                    headerImageUrl,
                                    prayData.namaDonatur,
                                    prayData.namaPendoa,
                                    effectiveTemplateLink,
                                    prayData.pesan ?? "",
                                    bodyVariableCount)
                            }
                        };

                        using var content = new StringContent(
                            JsonSerializer.Serialize(payload),
                            Encoding.UTF8,
                            "application/json"
                        );

                        using var response = await httpClient.PostAsync(gatewayUrl, content);
                        latestStatusCode = response.StatusCode;
                        latestResponseBody = await response.Content.ReadAsStringAsync();

                        if (response.IsSuccessStatusCode)
                        {
                            usedTemplateName = candidateTemplateName;
                            usedLanguageCode = candidateLanguageCode;
                            goto TemplateMessageSent;
                        }

                        if (IsTemplateParameterGatewayError(latestResponseBody))
                        {
                            if (includeHeader)
                            {
                                var fallbackPayload = new
                                {
                                    phone_number = phoneNumber,
                                    channel = "whatsapp",
                                    message_type = "template",
                                    template = new
                                    {
                                        name = candidateTemplateName,
                                        language = new { code = candidateLanguageCode },
                                        components = BuildTemplateComponents(
                                            includeHeader: false,
                                            headerImageUrl: "",
                                            namaDonatur: prayData.namaDonatur,
                                            namaPendoa: prayData.namaPendoa,
                                            link: effectiveTemplateLink,
                                            isiDoa: prayData.pesan ?? "",
                                            bodyVariableCount: bodyVariableCount)
                                    }
                                };

                                using var fallbackContent = new StringContent(
                                    JsonSerializer.Serialize(fallbackPayload),
                                    Encoding.UTF8,
                                    "application/json"
                                );

                                using var fallbackResponse = await httpClient.PostAsync(gatewayUrl, fallbackContent);
                                latestStatusCode = fallbackResponse.StatusCode;
                                latestResponseBody = await fallbackResponse.Content.ReadAsStringAsync();

                                if (fallbackResponse.IsSuccessStatusCode)
                                {
                                    usedTemplateName = candidateTemplateName;
                                    usedLanguageCode = candidateLanguageCode;
                                    goto TemplateMessageSent;
                                }
                            }

                            string headerTypeHint = matchedTemplateInfo?.headerType ?? "";
                            if (string.IsNullOrWhiteSpace(headerTypeHint))
                            {
                                headerTypeHint = "(tanpa header)";
                            }

                            return new ResponseData<object>
                            {
                                success = false,
                                message =
                                    "Gagal mengirim template WhatsApp: parameter template tidak cocok. " +
                                    $"Template: {candidateTemplateName}:{candidateLanguageCode}. " +
                                    $"Header template gateway: {headerTypeHint}. " +
                                    $"Body variable template: {bodyVariableCount}. " +
                                    "Saran: jika template tidak punya header, kosongkan `Image Pesan` di Application Setting atau gunakan template yang punya image header. " +
                                    $"Detail: {BuildGatewayErrorMessage(latestStatusCode, latestResponseBody)}",
                                data = ParseGatewayResponseBody(latestResponseBody)
                            };
                        }

                        if (!IsTemplateNotFoundGatewayError(latestResponseBody))
                        {
                            return new ResponseData<object>
                            {
                                success = false,
                                message = BuildGatewayErrorMessage(latestStatusCode, latestResponseBody),
                                data = ParseGatewayResponseBody(latestResponseBody)
                            };
                        }
                    }
                }

                return new ResponseData<object>
                {
                    success = false,
                    message =
                        "Template WhatsApp tidak ditemukan atau belum disetujui. " +
                        $"Template setting: `{templateName}`. " +
                        $"Percobaan: {string.Join(", ", attemptedCombinations)}. " +
                        (templateLookup.success
                            ? "Lookup template gateway: OK. "
                            : $"Lookup template gateway tidak tersedia ({templateLookup.statusHint}). ") +
                        $"Template/language APPROVED tersedia: {FormatAvailableTemplateHints(availableApprovedTemplateHints)}. " +
                        "Saran: cek `WA Template Name` dan language config (`WhatsAppGateway:TemplateLanguageCode` / `TemplateLanguageFallbacks`). " +
                        $"Response terakhir ({latestStatusCode}): {latestResponseBody}",
                    data = ParseGatewayResponseBody(latestResponseBody)
                };

            TemplateMessageSent:

                if (prayData.id_TRBirthdayPray > 0)
                {
                    repo.MarkWASent(prayData.id_TRBirthdayPray, conn);
                }

                // --- KIRIM PESAN SUARA (Jika ada) ---
                if (!string.IsNullOrWhiteSpace(prayData.pathPesanSuara))
                {
                    try
                    {
                        string mediaUrl = ResolveStoredAudioDeliveryUrl(prayData.pathPesanSuara);
                        string mediaMessageType = ResolveWhatsAppMediaMessageType(prayData.pathPesanSuara, mediaUrl);
                        var mediaPayload = new
                        {
                            phone_number = phoneNumber,
                            channel = "whatsapp",
                            message_type = mediaMessageType,
                            media_url = mediaUrl
                        };

                        using var mediaContent = new StringContent(
                            JsonSerializer.Serialize(mediaPayload),
                            Encoding.UTF8,
                            "application/json"
                        );

                        // Kirim media rekaman secara best-effort setelah template sukses.
                        await httpClient.PostAsync(gatewayUrl, mediaContent);
                    }
                    catch (Exception)
                    {
                        // Jika suara gagal, kita tetap anggap sukses kirim teksnya saja
                        // tapi log errornya (bisa ditambahkan logging di sini)
                    }
                }
                // ------------------------------------

                return new ResponseData<object>
                {
                    success = true,
                    message = $"Pesan WhatsApp berhasil dikirim (template: {usedTemplateName}, language: {usedLanguageCode}).",
                    data = ParseGatewayResponseBody(latestResponseBody)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<object> { success = false, message = ex.Message };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public async Task<ResponseData<object>> SendTestWhatsAppText(long idDonatur, int? year = null, string? messageText = null)
        {
            int targetYear = year ?? DateTime.Today.Year;
            try
            {
                if (conn.State == ConnectionState.Closed) conn.Open();
                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || prayData.id_donatur <= 0)
                    return new ResponseData<object> { success = false, message = "Data tidak ditemukan." };

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                var setting = settingRepo.GetSetting(conn);
                string gatewayToken = ResolveGatewayToken(setting.whatsappGatewayToken);
                string phoneNumber = FormatPhoneNumber(prayData.noHPDonatur);
                string testMessage = (messageText ?? "").Trim();
                if (string.IsNullOrWhiteSpace(testMessage))
                {
                    testMessage = (prayData.pesan ?? "").Trim();
                }
                if (string.IsNullOrWhiteSpace(testMessage))
                {
                    testMessage = "Test Message";
                }

                var payload = new
                {
                    phone_number = phoneNumber,
                    channel = "whatsapp",
                    message_type = "text",
                    content = testMessage
                };

                return await PostToGateway(gatewayUrl, gatewayToken, payload);
            }
            catch (Exception ex) { return new ResponseData<object> { success = false, message = ex.Message }; }
            finally { if (conn.State == ConnectionState.Open) conn.Close(); }
        }

        public async Task<ResponseData<object>> SendTestWhatsAppVoice(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;
            try
            {
                if (conn.State == ConnectionState.Closed) conn.Open();
                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || string.IsNullOrWhiteSpace(prayData.pathPesanSuara))
                    return new ResponseData<object> { success = false, message = "Data suara tidak ditemukan." };

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                var setting = settingRepo.GetSetting(conn);
                string gatewayToken = ResolveGatewayToken(setting.whatsappGatewayToken);
                string publicBaseUrl = GetPublicBaseUrl();
                string audioUrl = await EnsureWhatsAppMp4VoiceAsync(prayData);
                if (StoredAudioRequiresPublicBaseUrl(prayData.pathPesanSuara) && string.IsNullOrWhiteSpace(publicBaseUrl))
                    return new ResponseData<object> { success = false, message = "Runtime.PublicBaseUrl belum diatur untuk test pesan suara." };
                if (StoredAudioRequiresPublicBaseUrl(prayData.pathPesanSuara))
                {
                    var publicBaseUrlValidation = ValidatePublicBaseUrl(publicBaseUrl);
                    if (!publicBaseUrlValidation.isValid)
                        return new ResponseData<object> { success = false, message = $"Runtime.PublicBaseUrl belum bisa diakses public untuk gateway pihak ketiga. {publicBaseUrlValidation.message}" };
                }
                string phoneNumber = FormatPhoneNumber(prayData.noHPDonatur);
                string mediaMessageType = ResolveWhatsAppMediaMessageType(prayData.pathPesanSuara, audioUrl);

                var payload = new
                {
                    phone_number = phoneNumber,
                    channel = "whatsapp",
                    message_type = mediaMessageType,
                    media_url = audioUrl
                };

                var sendResult = await PostToGateway(gatewayUrl, gatewayToken, payload);
                if (!sendResult.success)
                {
                    return sendResult;
                }

                var latestStatus = await TryGetLatestOutboundGatewayMessageStatusAsync(
                    gatewayUrl,
                    gatewayToken,
                    phoneNumber,
                    mediaMessageType,
                    audioUrl);

                if (!string.IsNullOrWhiteSpace(latestStatus.status))
                {
                    string statusNote = latestStatus.status.Equals("DELIVERED", StringComparison.OrdinalIgnoreCase) ||
                        latestStatus.status.Equals("READ", StringComparison.OrdinalIgnoreCase)
                            ? "sudah sampai ke WhatsApp penerima"
                            : "request sudah diterima gateway, tapi belum delivered/read di WhatsApp penerima";

                    sendResult.message =
                        $"Test Voice diterima gateway. Status: {latestStatus.status} ({statusNote}).";

                    if (!string.IsNullOrWhiteSpace(latestStatus.error))
                    {
                        sendResult.message += $" Error: {latestStatus.error}";
                    }

                    sendResult.data = new
                    {
                        sendResponse = sendResult.data,
                        latestMessage = latestStatus
                    };
                }
                else if (!string.IsNullOrWhiteSpace(latestStatus.lookupError))
                {
                    sendResult.message =
                        $"Test Voice diterima gateway, tapi status delivery belum bisa dicek. {latestStatus.lookupError}";
                }

                return sendResult;
            }
            catch (Exception ex) { return new ResponseData<object> { success = false, message = ex.Message }; }
            finally { if (conn.State == ConnectionState.Open) conn.Close(); }
        }

        public async Task<ResponseData<object>> GetWhatsAppPhoneNumbers()
        {
            try
            {
                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = ResolveGatewayToken(GetSettingGatewayTokenFromDb());

                // Derive phone-numbers URL from the main send URL
                // main: https://chat.api.co.id/api/v1/public/messages/send
                // target: https://chat.api.co.id/api/v1/public/phone-numbers
                string phoneNumbersUrl = gatewayUrl.Replace("/messages/send", "/phone-numbers");

                using var client = new HttpClient();
                if (!string.IsNullOrWhiteSpace(gatewayToken))
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", gatewayToken);

                using var response = await client.GetAsync(phoneNumbersUrl);
                string body = await response.Content.ReadAsStringAsync();

                return new ResponseData<object>
                {
                    success = response.IsSuccessStatusCode,
                    message = response.IsSuccessStatusCode
                        ? "Berhasil mengambil data nomor"
                        : BuildGatewayErrorMessage(response.StatusCode, body),
                    data = ParseGatewayResponseBody(body)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<object> { success = false, message = ex.Message };
            }
        }

        public async Task<ResponseData<object>> GetWhatsAppDeliveryStatus(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;

            try
            {
                if (conn.State == ConnectionState.Closed) conn.Open();

                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || prayData.id_donatur <= 0)
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = "Data birthday pray tidak ditemukan."
                    };
                }

                string phoneNumber = FormatPhoneNumber(prayData.noHPDonatur);
                if (string.IsNullOrWhiteSpace(phoneNumber))
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = "Nomor HP donatur tidak tersedia."
                    };
                }

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                if (string.IsNullOrWhiteSpace(gatewayUrl))
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = "WhatsApp gateway URL belum diatur."
                    };
                }

                var setting = settingRepo.GetSetting(conn);
                string gatewayToken = ResolveGatewayToken(setting.whatsappGatewayToken);
                string messagesUrl = BuildGatewayConversationMessagesUrl(gatewayUrl, phoneNumber, 10);

                using var client = new HttpClient();
                if (!string.IsNullOrWhiteSpace(gatewayToken))
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", gatewayToken);

                using var response = await client.GetAsync(messagesUrl);
                string body = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    return new ResponseData<object>
                    {
                        success = false,
                        message = BuildGatewayErrorMessage(response.StatusCode, body),
                        data = ParseGatewayResponseBody(body)
                    };
                }

                var statusSummary = BuildWhatsAppDeliveryStatusSummary(body, 6);

                return new ResponseData<object>
                {
                    success = true,
                    message = statusSummary.summary,
                    data = new
                    {
                        phoneNumber,
                        checkedAt = DateTime.Now,
                        latestOutboundMessages = statusSummary.messages,
                        gatewayResponse = ParseGatewayResponseBody(body)
                    }
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<object> { success = false, message = ex.Message };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        private string FormatPhoneNumber(string raw)
        {
            string cleaned = raw.Replace("+", "").Replace("-", "").Replace(" ", "");
            if (cleaned.StartsWith("0")) return "62" + cleaned.Substring(1);
            if (!cleaned.StartsWith("62")) return "62" + cleaned;
            return cleaned;
        }

        private async Task<ResponseData<object>> PostToGateway(string url, string token, object payload)
        {
            using var client = new HttpClient();
            if (!string.IsNullOrWhiteSpace(token))
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var response = await client.PostAsync(url, content);
            string body = await response.Content.ReadAsStringAsync();

            return new ResponseData<object>
            {
                success = response.IsSuccessStatusCode,
                message = response.IsSuccessStatusCode
                    ? "Test Berhasil Terkirim"
                    : BuildGatewayErrorMessage(response.StatusCode, body),
                data = ParseGatewayResponseBody(body)
            };
        }

        private sealed class GatewayMessageStatus
        {
            public string id { get; set; } = "";
            public string messageType { get; set; } = "";
            public string status { get; set; } = "";
            public string content { get; set; } = "";
            public string mediaUrl { get; set; } = "";
            public string wamId { get; set; } = "";
            public string timestamp { get; set; } = "";
            public string error { get; set; } = "";
            public string lookupError { get; set; } = "";
        }

        private string BuildGatewayConversationMessagesUrl(string gatewayUrl, string phoneNumber, int limit)
        {
            string escapedPhoneNumber = Uri.EscapeDataString(phoneNumber);
            string normalizedGatewayUrl = (gatewayUrl ?? "").Trim();
            if (normalizedGatewayUrl.Contains("/messages/send", StringComparison.OrdinalIgnoreCase))
            {
                return normalizedGatewayUrl.Replace(
                    "/messages/send",
                    $"/conversations/{escapedPhoneNumber}/messages?limit={limit}",
                    StringComparison.OrdinalIgnoreCase);
            }

            return $"{normalizedGatewayUrl.TrimEnd('/')}/conversations/{escapedPhoneNumber}/messages?limit={limit}";
        }

        private (string summary, List<GatewayMessageStatus> messages) BuildWhatsAppDeliveryStatusSummary(
            string body,
            int limit)
        {
            var messages = ExtractLatestOutboundGatewayMessages(body, limit);
            if (messages.Count == 0)
            {
                return ("Belum ada outbound message WhatsApp yang ditemukan untuk donatur ini.", messages);
            }

            string compactStatus = string.Join(", ", messages.Select(item =>
            {
                string type = string.IsNullOrWhiteSpace(item.messageType) ? "UNKNOWN" : item.messageType;
                string status = string.IsNullOrWhiteSpace(item.status) ? "UNKNOWN" : item.status;
                return $"{type}:{status}";
            }));

            var latest = messages[0];
            string latestStatus = string.IsNullOrWhiteSpace(latest.status) ? "UNKNOWN" : latest.status;
            string latestType = string.IsNullOrWhiteSpace(latest.messageType) ? "UNKNOWN" : latest.messageType;
            string summary = $"Status WA terakhir: {compactStatus}. Pesan terbaru {latestType} = {latestStatus}.";

            if (latestStatus.Equals("SENT", StringComparison.OrdinalIgnoreCase))
            {
                summary += " Artinya request sudah diterima gateway/Meta, tapi belum delivered/read di WhatsApp penerima.";
            }
            else if (latestStatus.Equals("DELIVERED", StringComparison.OrdinalIgnoreCase))
            {
                summary += " Pesan sudah sampai ke WhatsApp penerima.";
            }
            else if (latestStatus.Equals("READ", StringComparison.OrdinalIgnoreCase))
            {
                summary += " Pesan sudah dibaca penerima.";
            }
            else if (latestStatus.Equals("FAILED", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(latest.error))
            {
                summary += $" Error: {latest.error}";
            }

            return (summary, messages);
        }

        private List<GatewayMessageStatus> ExtractLatestOutboundGatewayMessages(string body, int limit)
        {
            var result = new List<GatewayMessageStatus>();
            if (string.IsNullOrWhiteSpace(body))
            {
                return result;
            }

            try
            {
                using var document = JsonDocument.Parse(body);
                if (!document.RootElement.TryGetProperty("data", out var dataElement) ||
                    !dataElement.TryGetProperty("messages", out var messagesElement) ||
                    messagesElement.ValueKind != JsonValueKind.Array)
                {
                    return result;
                }

                foreach (var messageElement in messagesElement.EnumerateArray())
                {
                    string direction = GetJsonString(messageElement, "direction");
                    if (!direction.Equals("OUTBOUND", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    result.Add(new GatewayMessageStatus
                    {
                        id = GetJsonString(messageElement, "id"),
                        messageType = GetJsonString(messageElement, "message_type"),
                        status = GetJsonString(messageElement, "status"),
                        content = GetJsonString(messageElement, "content"),
                        mediaUrl = GetJsonString(messageElement, "media_url"),
                        wamId = GetJsonString(messageElement, "wam_id"),
                        timestamp = GetJsonString(messageElement, "timestamp"),
                        error = GetJsonString(messageElement, "error")
                    });

                    if (result.Count >= limit)
                    {
                        break;
                    }
                }
            }
            catch
            {
                return new List<GatewayMessageStatus>();
            }

            return result;
        }

        private async Task<GatewayMessageStatus> TryGetLatestOutboundGatewayMessageStatusAsync(
            string gatewayUrl,
            string token,
            string phoneNumber,
            string messageType,
            string mediaUrl)
        {
            var result = new GatewayMessageStatus();

            try
            {
                string messagesUrl = BuildGatewayConversationMessagesUrl(gatewayUrl, phoneNumber, 10);

                using var client = new HttpClient();
                if (!string.IsNullOrWhiteSpace(token))
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                using var response = await client.GetAsync(messagesUrl);
                string body = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    result.lookupError = BuildGatewayErrorMessage(response.StatusCode, body);
                    return result;
                }

                using var document = JsonDocument.Parse(body);
                if (!document.RootElement.TryGetProperty("data", out var dataElement) ||
                    !dataElement.TryGetProperty("messages", out var messagesElement) ||
                    messagesElement.ValueKind != JsonValueKind.Array)
                {
                    result.lookupError = "Response conversation gateway tidak berisi daftar messages.";
                    return result;
                }

                string expectedType = (messageType ?? "").Trim().ToUpperInvariant();
                string expectedMediaUrl = (mediaUrl ?? "").Trim();

                foreach (var messageElement in messagesElement.EnumerateArray())
                {
                    string direction = GetJsonString(messageElement, "direction");
                    string currentType = GetJsonString(messageElement, "message_type");
                    string currentMediaUrl = GetJsonString(messageElement, "media_url");

                    if (!direction.Equals("OUTBOUND", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (!string.IsNullOrWhiteSpace(expectedType) &&
                        !currentType.Equals(expectedType, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (!string.IsNullOrWhiteSpace(expectedMediaUrl) &&
                        !currentMediaUrl.Equals(expectedMediaUrl, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    result.id = GetJsonString(messageElement, "id");
                    result.messageType = currentType;
                    result.status = GetJsonString(messageElement, "status");
                    result.mediaUrl = currentMediaUrl;
                    result.wamId = GetJsonString(messageElement, "wam_id");
                    result.timestamp = GetJsonString(messageElement, "timestamp");
                    result.error = GetJsonString(messageElement, "error");
                    return result;
                }

                result.lookupError = "Message media terbaru belum ditemukan di conversation gateway.";
                return result;
            }
            catch (Exception ex)
            {
                result.lookupError = ex.Message;
                return result;
            }
        }

        private object ParseGatewayResponseBody(string body)
        {
            if (string.IsNullOrWhiteSpace(body))
            {
                return "";
            }

            try
            {
                using var document = JsonDocument.Parse(body);
                return document.RootElement.Clone();
            }
            catch (JsonException)
            {
                return body;
            }
        }

        private string BuildGatewayErrorMessage(HttpStatusCode statusCode, string body)
        {
            string detail = ExtractGatewayErrorDetail(body);
            if (string.IsNullOrWhiteSpace(detail))
            {
                return $"Gateway Error: {statusCode}";
            }

            return $"Gateway Error: {statusCode}. {detail}";
        }

        private string ExtractGatewayErrorDetail(string body)
        {
            if (string.IsNullOrWhiteSpace(body))
            {
                return "";
            }

            try
            {
                using var document = JsonDocument.Parse(body);
                JsonElement root = document.RootElement;

                if (root.TryGetProperty("error", out var errorElement) &&
                    errorElement.ValueKind == JsonValueKind.Object)
                {
                    string code = GetJsonString(errorElement, "code");
                    string message = GetJsonString(errorElement, "message");
                    string originalMessage = "";
                    if (errorElement.TryGetProperty("details", out var detailsElement) &&
                        detailsElement.ValueKind == JsonValueKind.Object)
                    {
                        originalMessage = GetJsonString(detailsElement, "original_message");
                    }

                    if (code.Equals("WindowClosed", StringComparison.OrdinalIgnoreCase))
                    {
                        return "Jendela chat 24 jam sudah lewat. Wajib kirim pesan template terlebih dahulu.";
                    }

                    if (code.Equals("NotFound", StringComparison.OrdinalIgnoreCase) &&
                        message.Contains("non-template messages", StringComparison.OrdinalIgnoreCase))
                    {
                        return "Kontak belum terdaftar untuk pesan text biasa. Kirim pesan template dulu agar customer dibuat oleh gateway.";
                    }

                    if (code.Equals("ValidationError", StringComparison.OrdinalIgnoreCase) &&
                        message.Contains("content is required", StringComparison.OrdinalIgnoreCase))
                    {
                        return "Isi pesan untuk Test Text masih kosong. Isi pesan dulu atau klik Save sebelum test.";
                    }

                    if (code.Equals("132018", StringComparison.OrdinalIgnoreCase) ||
                        originalMessage.Contains("parameters in your template", StringComparison.OrdinalIgnoreCase))
                    {
                        return "Parameter template tidak cocok dengan definisi template Meta (biasanya header/placeholder body).";
                    }

                    if (!string.IsNullOrWhiteSpace(message) && !string.IsNullOrWhiteSpace(code))
                    {
                        return $"{code}: {message}";
                    }

                    if (!string.IsNullOrWhiteSpace(message))
                    {
                        return message;
                    }

                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        return code;
                    }
                }

                string rootMessage = GetJsonString(root, "message");
                if (!string.IsNullOrWhiteSpace(rootMessage))
                {
                    return rootMessage;
                }
            }
            catch (JsonException)
            {
                // fallback ke raw body
            }

            return TruncateForLog(body, 220);
        }

        private string GetConfiguredTemplateLanguageCode()
        {
            string configured = (configuration["WhatsAppGateway:TemplateLanguageCode"] ?? "").Trim();
            return string.IsNullOrWhiteSpace(configured) ? "id" : configured;
        }

        private string ResolveGatewayToken(string? tokenFromSetting)
        {
            string value = (tokenFromSetting ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            return (configuration["WhatsAppGateway:Token"] ?? "").Trim();
        }

        private string GetSettingGatewayTokenFromDb()
        {
            bool shouldClose = conn.State == ConnectionState.Closed;
            try
            {
                if (shouldClose)
                {
                    conn.Open();
                }

                var setting = settingRepo.GetSetting(conn);
                return setting.whatsappGatewayToken ?? "";
            }
            catch
            {
                return "";
            }
            finally
            {
                if (shouldClose && conn.State == ConnectionState.Open)
                {
                    conn.Close();
                }
            }
        }

        private async Task<GatewayTemplateLookupResult> TryGetGatewayTemplateCatalogAsync(
            HttpClient httpClient,
            string gatewaySendUrl)
        {
            string templateUrl = BuildGatewayTemplatesUrl(gatewaySendUrl);
            if (string.IsNullOrWhiteSpace(templateUrl))
            {
                return new GatewayTemplateLookupResult
                {
                    success = false,
                    statusHint = "URL template gateway tidak valid."
                };
            }

            try
            {
                using var response = await httpClient.GetAsync(templateUrl);
                string body = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new GatewayTemplateLookupResult
                    {
                        success = false,
                        statusHint = $"{response.StatusCode}: {TruncateForLog(body, 200)}"
                    };
                }

                return ParseGatewayTemplateCatalog(body);
            }
            catch (Exception ex)
            {
                return new GatewayTemplateLookupResult
                {
                    success = false,
                    statusHint = ex.Message
                };
            }
        }

        private GatewayTemplateLookupResult ParseGatewayTemplateCatalog(string body)
        {
            if (string.IsNullOrWhiteSpace(body))
            {
                return new GatewayTemplateLookupResult
                {
                    success = false,
                    statusHint = "Response template kosong."
                };
            }

            try
            {
                using var document = JsonDocument.Parse(body);
                JsonElement root = document.RootElement;

                if (!root.TryGetProperty("data", out var dataElement) ||
                    dataElement.ValueKind != JsonValueKind.Array)
                {
                    return new GatewayTemplateLookupResult
                    {
                        success = false,
                        statusHint = "Format response template tidak sesuai."
                    };
                }

                var approvedTemplates = new List<GatewayTemplateInfo>();
                foreach (var item in dataElement.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }

                    string templateName = GetJsonString(item, "template_name");
                    string languageCode = GetJsonString(item, "language");
                    string status = GetJsonString(item, "status");
                    string headerType = GetJsonString(item, "header_type");
                    string content = GetJsonString(item, "content");
                    bool hasVariables = GetJsonBoolean(item, "has_variables");

                    if (string.IsNullOrWhiteSpace(templateName) || string.IsNullOrWhiteSpace(languageCode))
                    {
                        continue;
                    }

                    if (!status.Equals("APPROVED", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    int bodyVariableCount = hasVariables ? CountTemplateBodyVariables(content) : 0;
                    if (hasVariables && bodyVariableCount <= 0)
                    {
                        bodyVariableCount = 4;
                    }

                    approvedTemplates.Add(new GatewayTemplateInfo
                    {
                        templateName = templateName.Trim(),
                        languageCode = languageCode.Trim(),
                        headerType = headerType.Trim(),
                        bodyVariableCount = bodyVariableCount
                    });
                }

                return new GatewayTemplateLookupResult
                {
                    success = true,
                    approvedTemplates = approvedTemplates
                };
            }
            catch (JsonException ex)
            {
                return new GatewayTemplateLookupResult
                {
                    success = false,
                    statusHint = $"Gagal parse response template: {ex.Message}"
                };
            }
        }

        private string BuildGatewayTemplatesUrl(string gatewaySendUrl)
        {
            string source = (gatewaySendUrl ?? "").Trim();
            if (string.IsNullOrWhiteSpace(source))
            {
                return "";
            }

            if (source.Contains("/messages/send", StringComparison.OrdinalIgnoreCase))
            {
                return source.Replace("/messages/send", "/templates", StringComparison.OrdinalIgnoreCase);
            }

            if (source.EndsWith("/", StringComparison.Ordinal))
            {
                return $"{source}templates";
            }

            return $"{source}/templates";
        }

        private GatewayTemplateInfo? TryGetTemplateInfo(
            List<GatewayTemplateInfo> templates,
            string templateName,
            string languageCode)
        {
            string normalizedTemplate = NormalizeTemplateName(templateName);
            string normalizedLanguage = NormalizeLanguageCode(languageCode);

            return templates.FirstOrDefault(item =>
                NormalizeTemplateName(item.templateName).Equals(normalizedTemplate, StringComparison.OrdinalIgnoreCase) &&
                NormalizeLanguageCode(item.languageCode).Equals(normalizedLanguage, StringComparison.OrdinalIgnoreCase));
        }

        private string NormalizeLanguageCode(string value)
        {
            return (value ?? "").Trim().Replace("-", "_").ToLowerInvariant();
        }

        private bool ShouldIncludeHeaderForTemplate(GatewayTemplateInfo? templateInfo, string headerImageUrl)
        {
            if (string.IsNullOrWhiteSpace(headerImageUrl))
            {
                return false;
            }

            if (templateInfo == null)
            {
                return true;
            }

            return templateInfo.headerType.Equals("IMAGE", StringComparison.OrdinalIgnoreCase);
        }

        private List<object> BuildTemplateComponents(
            bool includeHeader,
            string headerImageUrl,
            string namaDonatur,
            string namaPendoa,
            string link,
            string isiDoa,
            int bodyVariableCount)
        {
            var components = new List<object>();

            if (includeHeader && !string.IsNullOrWhiteSpace(headerImageUrl))
            {
                components.Add(new
                {
                    type = "header",
                    parameters = new[]
                    {
                        new { type = "image", image = new { link = headerImageUrl } }
                    }
                });
            }

            if (bodyVariableCount <= 0)
            {
                return components;
            }

            var sourceValues = new[]
            {
                namaDonatur ?? "",
                namaPendoa ?? "",
                link ?? "",
                isiDoa ?? ""
            };

            var bodyParameters = new List<object>();
            for (int i = 0; i < bodyVariableCount; i++)
            {
                string value = i < sourceValues.Length ? sourceValues[i] : "";
                bodyParameters.Add(new { type = "text", text = value });
            }

            components.Add(new
            {
                type = "body",
                parameters = bodyParameters
            });

            return components;
        }

        private bool TemplateNameMatches(string templateName, List<string> candidates)
        {
            string normalizedTemplateName = NormalizeTemplateName(templateName);
            if (string.IsNullOrWhiteSpace(normalizedTemplateName))
            {
                return false;
            }

            return candidates.Any(candidate =>
                NormalizeTemplateName(candidate).Equals(normalizedTemplateName, StringComparison.OrdinalIgnoreCase));
        }

        private string NormalizeTemplateName(string value)
        {
            return (value ?? "").Trim().ToLowerInvariant().Replace(" ", "_");
        }

        private List<string> BuildTemplateHints(List<GatewayTemplateInfo> templates, int maxItems)
        {
            var hints = new List<string>();
            foreach (var item in templates)
            {
                AddUnique(hints, $"{item.templateName}:{item.languageCode}");
                if (hints.Count >= maxItems)
                {
                    break;
                }
            }

            return hints;
        }

        private string FormatAvailableTemplateHints(List<string> hints)
        {
            if (hints.Count == 0)
            {
                return "(tidak ada template APPROVED)";
            }

            return string.Join(", ", hints);
        }

        private string GetJsonString(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var property))
            {
                return "";
            }

            if (property.ValueKind == JsonValueKind.String)
            {
                return property.GetString() ?? "";
            }

            return property.ToString() ?? "";
        }

        private bool GetJsonBoolean(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var property))
            {
                return false;
            }

            if (property.ValueKind == JsonValueKind.True)
            {
                return true;
            }

            if (property.ValueKind == JsonValueKind.False)
            {
                return false;
            }

            if (property.ValueKind == JsonValueKind.String)
            {
                return bool.TryParse(property.GetString(), out bool parsed) && parsed;
            }

            return false;
        }

        private int CountTemplateBodyVariables(string templateContent)
        {
            string content = templateContent ?? "";
            if (string.IsNullOrWhiteSpace(content))
            {
                return 0;
            }

            var indexes = new HashSet<int>();
            int cursor = 0;
            while (cursor < content.Length)
            {
                int open = content.IndexOf("{{", cursor, StringComparison.Ordinal);
                if (open < 0)
                {
                    break;
                }

                int close = content.IndexOf("}}", open + 2, StringComparison.Ordinal);
                if (close < 0)
                {
                    break;
                }

                string numberText = content.Substring(open + 2, close - (open + 2)).Trim();
                if (int.TryParse(numberText, out int number) && number > 0)
                {
                    indexes.Add(number);
                }

                cursor = close + 2;
            }

            return indexes.Count;
        }

        private string TruncateForLog(string value, int maxLength)
        {
            string source = value ?? "";
            if (source.Length <= maxLength)
            {
                return source;
            }

            return source[..maxLength] + "...";
        }

        private List<string> BuildTemplateLanguageCandidates(string configuredLanguageCode)
        {
            var candidates = new List<string>();
            AddUnique(candidates, configuredLanguageCode);

            string normalized = configuredLanguageCode.Replace("-", "_").Trim();
            if (normalized.Equals("id", StringComparison.OrdinalIgnoreCase))
            {
                AddUnique(candidates, "id_ID");
            }
            else if (normalized.Equals("id_id", StringComparison.OrdinalIgnoreCase))
            {
                AddUnique(candidates, "id");
            }

            string configuredFallbacks = (configuration["WhatsAppGateway:TemplateLanguageFallbacks"] ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(configuredFallbacks))
            {
                foreach (var fallback in configuredFallbacks.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    AddUnique(candidates, fallback.Trim());
                }
            }

            return candidates;
        }

        private List<string> BuildTemplateNameCandidates(string templateName)
        {
            string raw = (templateName ?? "").Trim();
            var candidates = new List<string>();
            AddUnique(candidates, raw);

            if (!string.IsNullOrWhiteSpace(raw))
            {
                string normalized = raw.ToLowerInvariant().Replace(" ", "_");
                AddUnique(candidates, normalized);
            }

            return candidates;
        }

        private bool IsTemplateNotFoundGatewayError(string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody))
            {
                return false;
            }

            try
            {
                using var document = JsonDocument.Parse(responseBody);
                JsonElement root = document.RootElement;

                if (root.TryGetProperty("error", out var errorElement))
                {
                    if (errorElement.ValueKind == JsonValueKind.Object)
                    {
                        if (errorElement.TryGetProperty("code", out var codeElement) &&
                            codeElement.ValueKind == JsonValueKind.String &&
                            codeElement.GetString() == "132001")
                        {
                            return true;
                        }

                        if (errorElement.TryGetProperty("error_code", out var errorCodeElement) &&
                            errorCodeElement.ValueKind == JsonValueKind.String &&
                            errorCodeElement.GetString()?.Equals("TemplateNotFound", StringComparison.OrdinalIgnoreCase) == true)
                        {
                            return true;
                        }

                        if (errorElement.TryGetProperty("message", out var messageElement) &&
                            messageElement.ValueKind == JsonValueKind.String &&
                            (
                                (messageElement.GetString() ?? "").Contains("TemplateNotFound", StringComparison.OrdinalIgnoreCase) ||
                                (messageElement.GetString() ?? "").Contains("template does not exist", StringComparison.OrdinalIgnoreCase)
                            ))
                        {
                            return true;
                        }
                    }
                }
            }
            catch (JsonException)
            {
                // fallback ke raw string check
            }

            return responseBody.Contains("TemplateNotFound", StringComparison.OrdinalIgnoreCase)
                || responseBody.Contains("132001", StringComparison.OrdinalIgnoreCase);
        }

        private bool IsTemplateParameterGatewayError(string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody))
            {
                return false;
            }

            try
            {
                using var document = JsonDocument.Parse(responseBody);
                JsonElement root = document.RootElement;

                if (root.TryGetProperty("error", out var errorElement) &&
                    errorElement.ValueKind == JsonValueKind.Object)
                {
                    string code = GetJsonString(errorElement, "code");
                    string errorCode = GetJsonString(errorElement, "error_code");
                    string message = GetJsonString(errorElement, "message");

                    string originalMessage = "";
                    if (errorElement.TryGetProperty("details", out var detailsElement) &&
                        detailsElement.ValueKind == JsonValueKind.Object)
                    {
                        originalMessage = GetJsonString(detailsElement, "original_message");
                    }

                    if (code.Equals("132018", StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    if (errorCode.Equals("WhatsAppError", StringComparison.OrdinalIgnoreCase) &&
                        (
                            message.Contains("parameter", StringComparison.OrdinalIgnoreCase) ||
                            originalMessage.Contains("parameters in your template", StringComparison.OrdinalIgnoreCase)
                        ))
                    {
                        return true;
                    }
                }
            }
            catch (JsonException)
            {
                // ignore
            }

            return responseBody.Contains("132018", StringComparison.OrdinalIgnoreCase)
                || responseBody.Contains("parameters in your template", StringComparison.OrdinalIgnoreCase);
        }

        private void AddUnique(List<string> values, string candidate)
        {
            if (string.IsNullOrWhiteSpace(candidate))
            {
                return;
            }

            if (!values.Any(x => string.Equals(x, candidate, StringComparison.OrdinalIgnoreCase)))
            {
                values.Add(candidate);
            }
        }

        private ResponseData<object> ValidateWhatsAppTemplateParameters(
            string templateName,
            string namaPenerima,
            string namaPendoa,
            string link,
            string isiDoa)
        {
            if (string.IsNullOrWhiteSpace(templateName))
            {
                return new ResponseData<object>
                {
                    success = false,
                    message = "Nama template WhatsApp belum diatur."
                };
            }

            var missingFields = new List<string>();

            if (string.IsNullOrWhiteSpace(namaPenerima))
                missingFields.Add("nama penerima");

            if (string.IsNullOrWhiteSpace(namaPendoa))
                missingFields.Add("pendoa");

            if (string.IsNullOrWhiteSpace(isiDoa))
                missingFields.Add("isi doa");

            if (missingFields.Count == 0)
            {
                return new ResponseData<object> { success = true };
            }

            return new ResponseData<object>
            {
                success = false,
                message = $"Parameter template WhatsApp belum lengkap. Lengkapi: {string.Join(", ", missingFields)}."
            };
        }

        private string GetPublicBaseUrl()
        {
            return (configuration["Runtime:PublicBaseUrl"] ?? "").Trim();
        }

        private string GetEffectiveVoiceStorageProvider(IDbConnection activeConn)
        {
            try
            {
                var setting = settingRepo.GetSetting(activeConn);
                if (string.Equals(setting.storageType, "GoogleCloud", StringComparison.OrdinalIgnoreCase))
                {
                    return "GoogleCloud";
                }
            }
            catch
            {
                // fallback ke config
            }

            return string.Equals(configuration["VoiceStorage:Provider"], "GoogleCloud", StringComparison.OrdinalIgnoreCase)
                ? "GoogleCloud"
                : "LocalServer";
        }

        private string GetVoiceStorageRootPath()
        {
            return (configuration["VoiceStorage:RootPath"] ?? "").Trim();
        }

        private string GetVoiceStorageEnvironmentFolder()
        {
            string configured = (configuration["VoiceStorage:EnvironmentFolder"] ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(configured))
            {
                return SanitizeFileName(configured);
            }

            return env.EnvironmentName.Equals("Production", StringComparison.OrdinalIgnoreCase)
                ? "prod"
                : "dev";
        }

        private string GetVoiceStoragePhysicalFolder()
        {
            string sharedRootPath = GetVoiceStorageRootPath();
            string environmentFolder = GetVoiceStorageEnvironmentFolder();

            if (!string.IsNullOrWhiteSpace(sharedRootPath))
            {
                return Path.Combine(sharedRootPath, environmentFolder);
            }

            return Path.Combine(env.WebRootPath, "uploads", "birthday-pray", environmentFolder);
        }

        private string BuildStoredVoiceRelativePath(string fileName)
        {
            string environmentFolder = GetVoiceStorageEnvironmentFolder();
            return Path.Combine("uploads", "birthday-pray", environmentFolder, fileName).Replace("\\", "/");
        }

        private (bool isValid, string message) ValidatePublicBaseUrl(string publicBaseUrl)
        {
            if (string.IsNullOrWhiteSpace(publicBaseUrl))
            {
                return (false, "Isi dengan URL tunnel/domain public yang bisa diakses internet.");
            }

            if (!Uri.TryCreate(publicBaseUrl, UriKind.Absolute, out var uri))
            {
                return (false, "Nilai bukan URL absolut yang valid.");
            }

            string host = (uri.Host ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(host))
            {
                return (false, "Host pada URL kosong.");
            }

            if (host == "localhost" || host == "0.0.0.0" || host.EndsWith(".local", StringComparison.OrdinalIgnoreCase))
            {
                return (false, "Host masih lokal dan tidak dapat diakses gateway pihak ketiga.");
            }

            if (IPAddress.TryParse(host, out var ipAddress))
            {
                if (IPAddress.IsLoopback(ipAddress))
                {
                    return (false, "Host masih loopback dan tidak dapat diakses gateway pihak ketiga.");
                }

                if (ipAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    byte[] bytes = ipAddress.GetAddressBytes();
                    bool isPrivate =
                        bytes[0] == 10 ||
                        (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                        (bytes[0] == 192 && bytes[1] == 168);

                    if (isPrivate)
                    {
                        return (false, "Host masih private/internal IP dan biasanya tidak bisa diakses internet.");
                    }
                }
            }

            return (true, "OK");
        }

        private string BuildAbsoluteUrl(string publicBaseUrl, string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return "";

            if (Uri.TryCreate(relativePath, UriKind.Absolute, out var absoluteUri))
                return absoluteUri.ToString();

            var normalizedPath = relativePath
                .Replace("\\", "/")
                .TrimStart('/');

            if (string.IsNullOrWhiteSpace(publicBaseUrl))
                return normalizedPath;

            return $"{publicBaseUrl.TrimEnd('/')}/{normalizedPath}";
        }

        private DateTime BuildBirthdayDate(DateTime sourceBirthday, int targetYear)
        {
            int day = Math.Min(sourceBirthday.Day, DateTime.DaysInMonth(targetYear, sourceBirthday.Month));
            return new DateTime(targetYear, sourceBirthday.Month, day);
        }

        private async Task<string> EnsureWhatsAppMp4VoiceAsync(ResponseModelTRBirthdayPray prayData)
        {
            string storedValue = (prayData.pathPesanSuara ?? "").Trim();
            string currentDeliveryUrl = ResolveStoredAudioDeliveryUrl(storedValue);
            string currentExtension = ResolveStoredMediaExtension(storedValue, currentDeliveryUrl);

            if (currentExtension == ".mp4")
            {
                return currentDeliveryUrl;
            }

            if (currentExtension != ".mp3")
            {
                throw new InvalidOperationException("File rekaman untuk WhatsApp harus berformat MP3 atau MP4.");
            }

            if (prayData.id_TRBirthdayPray <= 0)
            {
                throw new InvalidOperationException("Data birthday pray belum tersimpan, tidak dapat meng-update path rekaman MP4.");
            }

            string tempFolder = Path.Combine(Path.GetTempPath(), "birthday-pray-mp4");
            Directory.CreateDirectory(tempFolder);

            string tempSourcePath = Path.Combine(tempFolder, $"{Guid.NewGuid():N}.mp3");
            string tempMp4Path = Path.Combine(tempFolder, $"{Guid.NewGuid():N}.mp4");

            try
            {
                await MaterializeStoredMediaToTempFileAsync(storedValue, currentDeliveryUrl, tempSourcePath);
                mediaConversionService.ConvertAudioToMp4WithPtLogo(tempSourcePath, tempMp4Path, GetCurrentUserPtCode());

                using var mp4Stream = new FileStream(tempMp4Path, FileMode.Open, FileAccess.Read, FileShare.Read);
                var convertedFile = new FormFile(
                    mp4Stream,
                    0,
                    mp4Stream.Length,
                    "audio",
                    BuildConvertedMp4FileName(storedValue, currentDeliveryUrl))
                {
                    Headers = new HeaderDictionary(),
                    ContentType = "video/mp4"
                };

                using var tran = conn.BeginTransaction();
                try
                {
                    string convertedPath = SaveVoiceFile(convertedFile, tran);
                    if (string.IsNullOrWhiteSpace(convertedPath))
                    {
                        throw new InvalidOperationException("URL MP4 hasil konversi tidak dapat dibentuk. Periksa Runtime.PublicBaseUrl dan storage voice.");
                    }

                    repo.UpdateVoicePath(prayData.id_TRBirthdayPray, convertedPath, conn, tran);
                    tran.Commit();

                    prayData.pathPesanSuara = convertedPath;
                    prayData.pathPesanSuaraUrl = ResolveStoredAudioPreviewUrl(convertedPath);

                    return ResolveStoredAudioDeliveryUrl(convertedPath);
                }
                catch
                {
                    try
                    {
                        tran.Rollback();
                    }
                    catch
                    {
                        // ignore rollback failure
                    }

                    throw;
                }
            }
            finally
            {
                TryDeleteFile(tempSourcePath);
                TryDeleteFile(tempMp4Path);
            }
        }

        private async Task MaterializeStoredMediaToTempFileAsync(string storedValue, string deliveryUrl, string targetPath)
        {
            string localPath = ResolveLocalStoredMediaPhysicalPath(storedValue);
            if (string.IsNullOrWhiteSpace(localPath))
            {
                localPath = ResolveLocalStoredMediaPhysicalPath(deliveryUrl);
            }

            if (!string.IsNullOrWhiteSpace(localPath) && File.Exists(localPath))
            {
                File.Copy(localPath, targetPath, overwrite: true);
                return;
            }

            if (Uri.TryCreate(deliveryUrl, UriKind.Absolute, out var mediaUri))
            {
                using var httpClient = new HttpClient();
                using var response = await httpClient.GetAsync(mediaUri);
                if (!response.IsSuccessStatusCode)
                {
                    throw new InvalidOperationException($"Gagal mengambil file MP3 sumber untuk konversi. Status: {(int)response.StatusCode} {response.ReasonPhrase}.");
                }

                await using var outputStream = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None);
                await response.Content.CopyToAsync(outputStream);
                return;
            }

            throw new InvalidOperationException("File MP3 sumber untuk konversi tidak ditemukan atau URL tidak valid.");
        }

        private string ResolveLocalStoredMediaPhysicalPath(string value)
        {
            string rawValue = (value ?? "").Trim();
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return "";
            }

            if (Path.IsPathRooted(rawValue) && File.Exists(rawValue))
            {
                return rawValue;
            }

            string pathValue = rawValue;
            if (Uri.TryCreate(rawValue, UriKind.Absolute, out var uri))
            {
                pathValue = Uri.UnescapeDataString(uri.AbsolutePath);
            }

            int suffixIndex = pathValue.IndexOfAny(new[] { '?', '#' });
            if (suffixIndex >= 0)
            {
                pathValue = pathValue[..suffixIndex];
            }

            string normalizedPath = pathValue.Replace("\\", "/").TrimStart('/');
            foreach (string relativePath in BuildLocalMediaRelativePathCandidates(normalizedPath))
            {
                string storageRoot = GetVoiceStorageRootPath();
                if (!string.IsNullOrWhiteSpace(storageRoot))
                {
                    string storageCandidate = Path.Combine(
                        storageRoot,
                        relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (File.Exists(storageCandidate))
                    {
                        return storageCandidate;
                    }
                }

                if (!string.IsNullOrWhiteSpace(env.WebRootPath))
                {
                    string webRootCandidate = Path.Combine(
                        env.WebRootPath,
                        relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (File.Exists(webRootCandidate))
                    {
                        return webRootCandidate;
                    }
                }
            }

            return "";
        }

        private IEnumerable<string> BuildLocalMediaRelativePathCandidates(string normalizedPath)
        {
            if (string.IsNullOrWhiteSpace(normalizedPath))
            {
                yield break;
            }

            yield return normalizedPath;

            const string apiUploadPrefix = "api/uploads/birthday-pray/";
            if (normalizedPath.StartsWith(apiUploadPrefix, StringComparison.OrdinalIgnoreCase))
            {
                yield return normalizedPath[apiUploadPrefix.Length..];
            }

            const string uploadPrefix = "uploads/birthday-pray/";
            if (normalizedPath.StartsWith(uploadPrefix, StringComparison.OrdinalIgnoreCase))
            {
                yield return normalizedPath[uploadPrefix.Length..];
            }
        }

        private string GetCurrentUserPtCode()
        {
            var user = httpContextAccessor.HttpContext?.User;
            string ptCode =
                user?.FindFirstValue("pt") ??
                user?.FindFirstValue("userpt") ??
                user?.FindFirstValue("Userpt") ??
                "";

            if (string.IsNullOrWhiteSpace(ptCode))
            {
                ptCode = configuration["MediaConversion:DefaultPtCode"] ?? "";
            }

            return ptCode.Trim();
        }

        private string BuildConvertedMp4FileName(params string[] sourceHints)
        {
            foreach (string sourceHint in sourceHints)
            {
                string fileName = ExtractFileNameWithoutExtension(sourceHint);
                if (!string.IsNullOrWhiteSpace(fileName))
                {
                    return $"{SanitizeFileName(fileName)}.mp4";
                }
            }

            return "pesan-suara.mp4";
        }

        private string ExtractFileNameWithoutExtension(string sourceHint)
        {
            if (string.IsNullOrWhiteSpace(sourceHint))
            {
                return "";
            }

            string value = sourceHint.Trim();
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri))
            {
                value = uri.AbsolutePath;
            }

            int suffixIndex = value.IndexOfAny(new[] { '?', '#' });
            if (suffixIndex >= 0)
            {
                value = value[..suffixIndex];
            }

            return Path.GetFileNameWithoutExtension(value);
        }

        private string SaveVoiceFile(IFormFile file, IDbTransaction tran)
        {
            var uploadResponse = voiceStorageService.UploadMp3(new RequestUploadVoiceMp3
            {
                audio = file
            }, tran);

            if (!uploadResponse.success || uploadResponse.data == null || uploadResponse.data.id <= 0)
            {
                throw new InvalidOperationException(uploadResponse.message ?? "Gagal upload file suara ke storage.");
            }

            return uploadResponse.data.fileUrl ?? "";
        }

        private bool IsSupportedAudioFile(IFormFile file)
        {
            string extension = Path.GetExtension(file.FileName ?? "").Trim().ToLowerInvariant();
            return extension == ".mp3" || extension == ".mp4";
        }

        private string ResolveWhatsAppMediaMessageType(params string[] values)
        {
            string extension = ResolveStoredMediaExtension(values);
            return extension == ".mp4" ? "video" : "audio";
        }

        private string ResolveStoredMediaExtension(params string[] values)
        {
            foreach (var value in values)
            {
                string extension = GetMediaExtension(value);
                if (!string.IsNullOrWhiteSpace(extension))
                {
                    return extension;
                }
            }

            return "";
        }

        private string GetMediaExtension(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "";
            }

            string target = value.Trim();
            if (Uri.TryCreate(target, UriKind.Absolute, out var uri))
            {
                target = uri.AbsolutePath;
            }

            int suffixIndex = target.IndexOfAny(new[] { '?', '#' });
            if (suffixIndex >= 0)
            {
                target = target[..suffixIndex];
            }

            return Path.GetExtension(target).Trim().ToLowerInvariant();
        }

        private string ResolveStoredAudioPreviewUrl(string storedValue)
        {
            if (string.IsNullOrWhiteSpace(storedValue))
            {
                return "";
            }

            if (TryParseVoiceRecordingReference(storedValue, out long voiceRecordingId))
            {
                // We use ResolvePlaybackUrl instead of BuildBackendPlaybackUrl 
                // so that LocalServer gets the direct physical path URL.
                return voiceStorageService.ResolvePlaybackUrl(voiceRecordingId, conn).url;
            }

            return BuildAbsoluteUrl(GetPublicBaseUrl(), storedValue);
        }

        private string ResolveStoredAudioDeliveryUrl(string storedValue)
        {
            if (string.IsNullOrWhiteSpace(storedValue))
            {
                return "";
            }

            if (TryParseVoiceRecordingReference(storedValue, out long voiceRecordingId))
            {
                return voiceStorageService.ResolvePlaybackUrl(voiceRecordingId, conn).url;
            }

            return BuildAbsoluteUrl(GetPublicBaseUrl(), storedValue);
        }

        private bool StoredAudioRequiresPublicBaseUrl(string storedValue)
        {
            if (string.IsNullOrWhiteSpace(storedValue))
            {
                return false;
            }

            if (TryParseVoiceRecordingReference(storedValue, out _))
            {
                return false;
            }

            return !Uri.TryCreate(storedValue, UriKind.Absolute, out _);
        }

        private string BuildVoiceRecordingReference(long id)
        {
            return $"voice-recording:{id}";
        }

        private bool TryParseVoiceRecordingReference(string storedValue, out long id)
        {
            id = 0;
            if (string.IsNullOrWhiteSpace(storedValue))
            {
                return false;
            }

            const string prefix = "voice-recording:";
            if (!storedValue.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return long.TryParse(storedValue[prefix.Length..], out id) && id > 0;
        }

        private string SanitizeFileName(string value)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            string safe = new string(value.Where(c => !invalidChars.Contains(c)).ToArray()).Trim();
            return string.IsNullOrWhiteSpace(safe) ? "donatur" : safe.Replace(" ", "_");
        }

        private sealed class GatewayTemplateLookupResult
        {
            public bool success { get; set; }
            public string statusHint { get; set; } = "";
            public List<GatewayTemplateInfo> approvedTemplates { get; set; } = new();
        }

        private sealed class GatewayTemplateInfo
        {
            public string templateName { get; set; } = "";
            public string languageCode { get; set; } = "";
            public string headerType { get; set; } = "";
            public int bodyVariableCount { get; set; }
        }
    }
}
