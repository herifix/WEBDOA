using API.Repository.global;
using API.Repository.Master;
using API.Repository.Transaction;
using Azure;
using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json.Linq;
using System;
using System.Data;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
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
        private readonly IWebHostEnvironment env;
        private readonly IConfiguration configuration;

        public ServiceTRBirthdayPray(
            IDbConnection conn,
            RepoTRBirthdayPray repo,
            RepoMasterDonatur donaturRepo,
            RepoApplicationSetting settingRepo,
            ServiceVoiceStorage voiceStorageService,
            IWebHostEnvironment env,
            IConfiguration configuration)
        {
            this.conn = conn;
            this.repo = repo;
            this.donaturRepo = donaturRepo;
            this.settingRepo = settingRepo;
            this.voiceStorageService = voiceStorageService;
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
                            message = "File pesan suara harus berformat MP3.",
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
                            message = "File pesan suara harus berformat MP3.",
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

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";
                string publicBaseUrl = GetPublicBaseUrl();

                if (string.IsNullOrWhiteSpace(gatewayUrl))
                {
                    return new ResponseData<object> { success = false, message = "WhatsApp gateway URL belum diatur." };
                }

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

                string templateName = setting.whatsappTemplateName;
                if (string.IsNullOrWhiteSpace(templateName))
                {
                    templateName = "birthday_pray"; // Default fallback
                }

                var templateValidation = ValidateWhatsAppTemplateParameters(
                    templateName,
                    prayData.namaDonatur,
                    prayData.namaPendoa,
                    setting.msgLink,
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

                var payload = new
                {
                    phone_number = phoneNumber,
                    channel = "whatsapp",
                    message_type = "template",
                    template = new
                    {
                        name = templateName,
                        language = new { code = "id" },
                        components = new List<object>()
                    }
                };

                // Add Header Component if image exists
                if (!string.IsNullOrWhiteSpace(headerImageUrl))
                {
                    payload.template.components.Add(new
                    {
                        type = "header",
                        parameters = new[]
                        {
                            new { type = "image", image = new { link = headerImageUrl } }
                        }
                    });
                }

                // Add Body Component with 4 parameters: donatur, pendoa, link, pesandoa
                payload.template.components.Add(new
                {
                    type = "body",
                    parameters = new[]
                    {
                        new { type = "text", text = prayData.namaDonatur },
                        new { type = "text", text = prayData.namaPendoa },
                        new { type = "text", text = setting.msgLink },
                        new { type = "text", text = prayData.pesan ?? "" }
                    }
                });

                using var httpClient = new HttpClient();
                if (!string.IsNullOrWhiteSpace(gatewayToken))
                {
                    httpClient.DefaultRequestHeaders.Authorization =
                        new AuthenticationHeaderValue("Bearer", gatewayToken);
                }

                using var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"
                );

                using var response = await httpClient.PostAsync(gatewayUrl, content);
                string responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    if (prayData.id_TRBirthdayPray > 0)
                    {
                        repo.MarkWASent(prayData.id_TRBirthdayPray, conn);
                    }

                    // --- KIRIM PESAN SUARA (Jika ada) ---
                    if (!string.IsNullOrWhiteSpace(prayData.pathPesanSuara))
                    {
                        try
                        {
                            string audioUrl = ResolveStoredAudioDeliveryUrl(prayData.pathPesanSuara);
                            var audioPayload = new
                            {
                                phone_number = phoneNumber,
                                channel = "whatsapp",
                                message_type = "audio",
                                audio = new { link = audioUrl }
                            };

                            using var audioContent = new StringContent(
                                JsonSerializer.Serialize(audioPayload),
                                Encoding.UTF8,
                                "application/json"
                            );

                            // Kirim pesan suara (fire and forget atau ditunggu sebentar)
                            await httpClient.PostAsync(gatewayUrl, audioContent);
                        }
                        catch (Exception ex)
                        {
                            // Jika suara gagal, kita tetap anggap sukses kirim teksnya saja
                            // tapi log errornya (bisa ditambahkan logging di sini)
                        }
                    }
                    // ------------------------------------

                    return new ResponseData<object>
                    {
                        success = true,
                        message = "Pesan WhatsApp berhasil dikirim.",
                        data = ParseGatewayResponseBody(responseBody)
                    };
                }

                return new ResponseData<object>
                {
                    success = false,
                    message = $"Gagal mengirim WhatsApp ({response.StatusCode}): {responseBody}",
                    data = ParseGatewayResponseBody(responseBody)
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

        public async Task<ResponseData<object>> SendTestWhatsAppText(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;
            try
            {
                if (conn.State == ConnectionState.Closed) conn.Open();
                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || prayData.id_donatur <= 0)
                    return new ResponseData<object> { success = false, message = "Data tidak ditemukan." };

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";
                string phoneNumber = FormatPhoneNumber(prayData.noHPDonatur);

                var payload = new
                {
                    phone_number = phoneNumber,
                    channel = "whatsapp",
                    message_type = "text",
                    content = prayData.pesan ?? "Test Message" 
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
                string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";
                string publicBaseUrl = GetPublicBaseUrl();
                if (StoredAudioRequiresPublicBaseUrl(prayData.pathPesanSuara) && string.IsNullOrWhiteSpace(publicBaseUrl))
                    return new ResponseData<object> { success = false, message = "Runtime.PublicBaseUrl belum diatur untuk test pesan suara." };
                if (StoredAudioRequiresPublicBaseUrl(prayData.pathPesanSuara))
                {
                    var publicBaseUrlValidation = ValidatePublicBaseUrl(publicBaseUrl);
                    if (!publicBaseUrlValidation.isValid)
                        return new ResponseData<object> { success = false, message = $"Runtime.PublicBaseUrl belum bisa diakses public untuk gateway pihak ketiga. {publicBaseUrlValidation.message}" };
                }
                string phoneNumber = FormatPhoneNumber(prayData.noHPDonatur);
                string audioUrl = ResolveStoredAudioDeliveryUrl(prayData.pathPesanSuara);

                var payload = new
                {
                    phone_number = phoneNumber,
                    channel = "whatsapp",
                    message_type = "audio",
                    media_url = audioUrl
                };

                return await PostToGateway(gatewayUrl, gatewayToken, payload);
            }
            catch (Exception ex) { return new ResponseData<object> { success = false, message = ex.Message }; }
            finally { if (conn.State == ConnectionState.Open) conn.Close(); }
        }

        public async Task<ResponseData<object>> GetWhatsAppPhoneNumbers()
        {
            try
            {
                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";

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
                    message = response.IsSuccessStatusCode ? "Berhasil mengambil data nomor" : $"Gateway Error: {response.StatusCode}",
                    data = ParseGatewayResponseBody(body)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<object> { success = false, message = ex.Message };
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
                message = response.IsSuccessStatusCode ? "Test Berhasil Terkirim" : $"Gateway Error: {response.StatusCode}",
                data = ParseGatewayResponseBody(body)
            };
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

            if (string.IsNullOrWhiteSpace(link))
                missingFields.Add("link");

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
            return extension == ".mp3";
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
    }
}
