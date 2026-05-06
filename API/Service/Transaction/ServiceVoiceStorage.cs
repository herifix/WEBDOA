using API.Repository.global;
using API.Repository.Master;
using API.Repository.Transaction;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using System.Data;
using System.Net.Http;

namespace API.Service.Transaction
{
    public class ServiceVoiceStorage
    {
        private const string ProviderLocalServer = "LocalServer";
        private const string ProviderGoogleCloud = "GoogleCloud";
        private const int DefaultMaxUploadSizeMb = 10;
        private readonly IDbConnection conn;
        private readonly IConfiguration configuration;
        private readonly RepoVoiceRecording repo;
        private readonly RepoApplicationSetting applicationSettingRepo;
        private readonly IWebHostEnvironment env;

        public ServiceVoiceStorage(
            IDbConnection conn,
            IConfiguration configuration,
            RepoVoiceRecording repo,
            RepoApplicationSetting applicationSettingRepo,
            IWebHostEnvironment env)
        {
            this.conn = conn;
            this.configuration = configuration;
            this.repo = repo;
            this.applicationSettingRepo = applicationSettingRepo;
            this.env = env;
        }

        public ResponseData<ResponseModelVoiceRecording> UploadMp3(RequestUploadVoiceMp3 request, IDbTransaction? tran = null)
        {
            bool shouldClose = false;
            var activeConn = tran?.Connection ?? conn;

            try
            {
                if (activeConn.State == ConnectionState.Closed)
                {
                    activeConn.Open();
                    shouldClose = tran == null;
                }

                if (request.audio == null || request.audio.Length <= 0)
                {
                    return FailedUpload("File audio wajib diisi.");
                }

                var validationError = ValidateMp3File(request.audio);
                if (!string.IsNullOrWhiteSpace(validationError))
                {
                    return FailedUpload(validationError);
                }

                var metadata = CreateAndStoreVoiceRecording(request.audio);
                var activeConnForInsert = tran?.Connection ?? conn;

                metadata.id = repo.Insert(metadata, activeConnForInsert, tran);
                metadata.createdAt = DateTime.Now;
                metadata.playbackUrl = BuildBackendPlaybackUrl(metadata.id);

                return new ResponseData<ResponseModelVoiceRecording>
                {
                    success = true,
                    message = "File MP3 berhasil diupload.",
                    data = metadata
                };
            }
            catch (Exception ex)
            {
                return FailedUpload(ex.Message);
            }
            finally
            {
                if (shouldClose && activeConn.State == ConnectionState.Open)
                {
                    activeConn.Close();
                }
            }
        }

        public ResponseData<ResponseModelVoiceRecording> GetMetadata(long id)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                {
                    conn.Open();
                }

                var item = repo.GetById(id, conn);
                if (item == null || item.id <= 0)
                {
                    return new ResponseData<ResponseModelVoiceRecording>
                    {
                        success = false,
                        message = "Metadata voice recording tidak ditemukan.",
                        data = new ResponseModelVoiceRecording()
                    };
                }

                item.playbackUrl = BuildBackendPlaybackUrl(item.id);

                return new ResponseData<ResponseModelVoiceRecording>
                {
                    success = true,
                    message = "OK",
                    data = item
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelVoiceRecording>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelVoiceRecording()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                {
                    conn.Close();
                }
            }
        }

        public ResponseData<ResponseModelVoiceSignedUrl> GetSignedUrl(long id)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                {
                    conn.Open();
                }

                var item = repo.GetById(id, conn);
                if (item == null || item.id <= 0)
                {
                    return new ResponseData<ResponseModelVoiceSignedUrl>
                    {
                        success = false,
                        message = "Metadata voice recording tidak ditemukan.",
                        data = new ResponseModelVoiceSignedUrl()
                    };
                }

                var resolved = ResolvePlaybackUrl(item);
                return new ResponseData<ResponseModelVoiceSignedUrl>
                {
                    success = true,
                    message = "OK",
                    data = resolved
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelVoiceSignedUrl>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelVoiceSignedUrl()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                {
                    conn.Close();
                }
            }
        }

        public ResponseModelVoiceSignedUrl ResolvePlaybackUrl(long id, IDbConnection? existingConn = null, IDbTransaction? tran = null)
        {
            bool shouldClose = false;
            var activeConn = existingConn ?? conn;

            try
            {
                if (activeConn.State == ConnectionState.Closed)
                {
                    activeConn.Open();
                    shouldClose = existingConn == null;
                }

                var item = repo.GetById(id, activeConn, tran);
                if (item == null || item.id <= 0)
                {
                    throw new InvalidOperationException("Metadata voice recording tidak ditemukan.");
                }

                return ResolvePlaybackUrl(item);
            }
            finally
            {
                if (shouldClose && activeConn.State == ConnectionState.Open)
                {
                    activeConn.Close();
                }
            }
        }

        public string BuildBackendPlaybackUrl(long id)
        {
            string publicBaseUrl = (configuration["Runtime:PublicBaseUrl"] ?? "").Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(publicBaseUrl))
            {
                return $"voice/{id}/redirect";
            }

            return $"{publicBaseUrl}/voice/{id}/redirect";
        }

        private ResponseModelVoiceSignedUrl ResolvePlaybackUrl(ResponseModelVoiceRecording item)
        {
            string provider = NormalizeProvider(item.provider, item);
            if (provider.Equals(ProviderLocalServer, StringComparison.OrdinalIgnoreCase))
            {
                string localUrl = !string.IsNullOrWhiteSpace(item.fileUrl)
                    ? item.fileUrl ?? ""
                    : BuildLocalPublicUrl(item.objectName);

                if (string.IsNullOrWhiteSpace(localUrl))
                {
                    throw new InvalidOperationException("URL file audio lokal tidak dapat dibentuk.");
                }

                return new ResponseModelVoiceSignedUrl
                {
                    id = item.id,
                    url = localUrl,
                    isPublicUrl = true,
                    expiresAt = null
                };
            }

            if (!string.IsNullOrWhiteSpace(item.fileUrl))
            {
                return new ResponseModelVoiceSignedUrl
                {
                    id = item.id,
                    url = item.fileUrl ?? "",
                    isPublicUrl = true,
                    expiresAt = null
                };
            }

            string bucketName = item.bucketName;
            if (string.IsNullOrWhiteSpace(bucketName) || string.IsNullOrWhiteSpace(item.objectName))
            {
                throw new InvalidOperationException("Metadata Google Cloud Storage belum lengkap.");
            }

            var credential = GoogleCredential.GetApplicationDefault();
            var signer = UrlSigner.FromCredential(credential);
            int expiryMinutes = GetSignedUrlExpiryMinutes();
            DateTime expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);
            string url = signer.Sign(
                bucketName,
                item.objectName,
                TimeSpan.FromMinutes(expiryMinutes),
                HttpMethod.Get
            );

            return new ResponseModelVoiceSignedUrl
            {
                id = item.id,
                url = url,
                expiresAt = expiresAt,
                isPublicUrl = false
            };
        }

        private ResponseData<ResponseModelVoiceRecording> FailedUpload(string message)
        {
            return new ResponseData<ResponseModelVoiceRecording>
            {
                success = false,
                message = message,
                data = new ResponseModelVoiceRecording()
            };
        }

        private string ValidateMp3File(IFormFile file)
        {
            if (file.Length <= 0)
            {
                return "File audio kosong.";
            }

            long maxBytes = GetMaxUploadSizeMb() * 1024L * 1024L;
            if (file.Length > maxBytes)
            {
                return $"Ukuran file audio melebihi batas {GetMaxUploadSizeMb()} MB.";
            }

            string extension = Path.GetExtension(file.FileName ?? "").Trim().ToLowerInvariant();
            if (extension != ".mp3")
            {
                return "File audio harus berformat MP3.";
            }

            string contentType = (file.ContentType ?? "").Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(contentType) &&
                contentType != "audio/mpeg" &&
                contentType != "audio/mp3" &&
                contentType != "application/octet-stream")
            {
                return "Content type file audio tidak valid. Gunakan file MP3.";
            }

            return "";
        }

        private string BuildObjectName()
        {
            return $"voice/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}.mp3";
        }

        private ResponseModelVoiceRecording CreateAndStoreVoiceRecording(IFormFile file)
        {
            string provider = GetStorageProvider();
            if (provider.Equals(ProviderLocalServer, StringComparison.OrdinalIgnoreCase))
            {
                return SaveToLocalServer(file);
            }

            return SaveToGoogleCloud(file);
        }

        private ResponseModelVoiceRecording SaveToGoogleCloud(IFormFile file)
        {
            string bucketName = GetBucketName();
            if (string.IsNullOrWhiteSpace(bucketName))
            {
                throw new InvalidOperationException("GoogleCloud:BucketName belum diatur.");
            }

            bool usePublicUrl = GetUsePublicUrl();
            string objectName = BuildObjectName();
            string fileName = Path.GetFileName(objectName);

            var storageClient = StorageClient.Create();
            using var stream = file.OpenReadStream();

            var uploadOptions = new UploadObjectOptions();
            if (usePublicUrl)
            {
                uploadOptions.PredefinedAcl = PredefinedObjectAcl.PublicRead;
            }

            storageClient.UploadObject(
                bucket: bucketName,
                objectName: objectName,
                contentType: "audio/mpeg",
                source: stream,
                options: uploadOptions
            );

            return new ResponseModelVoiceRecording
            {
                provider = ProviderGoogleCloud,
                fileName = fileName,
                bucketName = bucketName,
                objectName = objectName,
                storagePath = "",
                fileUrl = usePublicUrl ? BuildPublicFileUrl(bucketName, objectName) : null,
                contentType = "audio/mpeg",
                fileSize = file.Length
            };
        }

        private ResponseModelVoiceRecording SaveToLocalServer(IFormFile file)
        {
            string fileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmssfff}_{Guid.NewGuid():N}.mp3";
            string relativePath = BuildStoredLocalRelativePath(fileName);
            string physicalFolder = GetLocalVoicePhysicalFolder();
            string physicalPath = Path.Combine(physicalFolder, fileName);

            if (!Directory.Exists(physicalFolder))
            {
                Directory.CreateDirectory(physicalFolder);
            }

            using (var stream = new FileStream(physicalPath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return new ResponseModelVoiceRecording
            {
                provider = ProviderLocalServer,
                fileName = fileName,
                bucketName = "",
                objectName = relativePath,
                storagePath = physicalPath,
                fileUrl = BuildLocalPublicUrl(relativePath),
                contentType = "audio/mpeg",
                fileSize = file.Length
            };
        }

        private string BuildPublicFileUrl(string bucketName, string objectName)
        {
            string escapedObjectName = Uri.EscapeDataString(objectName).Replace("%2F", "/");
            return $"https://storage.googleapis.com/{bucketName}/{escapedObjectName}";
        }

        private string BuildLocalPublicUrl(string relativePath)
        {
            string publicBaseUrl = (configuration["Runtime:PublicBaseUrl"] ?? "").Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(publicBaseUrl) || string.IsNullOrWhiteSpace(relativePath))
            {
                return "";
            }

            string normalizedPath = relativePath.Replace("\\", "/").TrimStart('/');
            return $"{publicBaseUrl}/{normalizedPath}";
        }

        private string BuildStoredLocalRelativePath(string fileName)
        {
            string environmentFolder = GetLocalEnvironmentFolder();
            return Path.Combine("uploads", "birthday-pray", environmentFolder, fileName).Replace("\\", "/");
        }

        private string GetLocalVoicePhysicalFolder()
        {
            string sharedRootPath = (configuration["VoiceStorage:RootPath"] ?? "").Trim();
            string environmentFolder = GetLocalEnvironmentFolder();

            if (!string.IsNullOrWhiteSpace(sharedRootPath))
            {
                return Path.Combine(sharedRootPath, environmentFolder);
            }

            return Path.Combine(env.WebRootPath, "uploads", "birthday-pray", environmentFolder);
        }

        private string GetLocalEnvironmentFolder()
        {
            string configured = (configuration["VoiceStorage:EnvironmentFolder"] ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(configured))
            {
                return SanitizePathSegment(configured);
            }

            return env.EnvironmentName.Equals("Production", StringComparison.OrdinalIgnoreCase)
                ? "prod"
                : "dev";
        }

        private string GetStorageProvider()
        {
            try
            {
                var appSetting = applicationSettingRepo.GetSetting(conn);
                string dbStorageType = NormalizeStorageType(appSetting.storageType);
                if (!string.IsNullOrWhiteSpace(dbStorageType))
                {
                    return dbStorageType;
                }
            }
            catch
            {
                // fallback ke appsettings bila setting database belum siap
            }

            string provider = (configuration["VoiceStorage:Provider"] ?? "").Trim();
            return NormalizeStorageType(provider);
        }

        private string NormalizeProvider(string? provider, ResponseModelVoiceRecording item)
        {
            string configured = (provider ?? "").Trim();
            if (configured.Equals(ProviderGoogleCloud, StringComparison.OrdinalIgnoreCase) ||
                configured.Equals(ProviderLocalServer, StringComparison.OrdinalIgnoreCase))
            {
                return configured;
            }

            if (!string.IsNullOrWhiteSpace(item.bucketName))
            {
                return ProviderGoogleCloud;
            }

            return ProviderLocalServer;
        }

        private string GetBucketName()
        {
            return (configuration["GoogleCloud:BucketName"] ?? "").Trim();
        }

        private bool GetUsePublicUrl()
        {
            return bool.TryParse(configuration["GoogleCloud:UsePublicUrl"], out bool value) && value;
        }

        private int GetSignedUrlExpiryMinutes()
        {
            if (int.TryParse(configuration["GoogleCloud:SignedUrlExpiryMinutes"], out int value) && value > 0)
            {
                return value;
            }

            return 15;
        }

        private int GetMaxUploadSizeMb()
        {
            if (int.TryParse(configuration["GoogleCloud:MaxUploadSizeMb"], out int value) && value > 0)
            {
                return value;
            }

            return DefaultMaxUploadSizeMb;
        }

        private string SanitizePathSegment(string value)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            string safe = new string(value.Where(c => !invalidChars.Contains(c)).ToArray()).Trim();
            return string.IsNullOrWhiteSpace(safe) ? "dev" : safe.Replace(" ", "_");
        }

        private string NormalizeStorageType(string? storageType)
        {
            return string.Equals(storageType, ProviderGoogleCloud, StringComparison.OrdinalIgnoreCase)
                ? ProviderGoogleCloud
                : ProviderLocalServer;
        }
    }
}
