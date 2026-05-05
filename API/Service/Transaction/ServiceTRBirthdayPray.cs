using API.Repository.global;
using API.Repository.Master;
using Microsoft.AspNetCore.Hosting;
using System.Data;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace API.Service.Transaction
{
    public class ServiceTRBirthdayPray
    {
        private readonly IDbConnection conn;
        private readonly RepoTRBirthdayPray repo;
        private readonly RepoMasterDonatur donaturRepo;
        private readonly RepoApplicationSetting settingRepo;
        private readonly IWebHostEnvironment env;
        private readonly IConfiguration configuration;

        public ServiceTRBirthdayPray(
            IDbConnection conn,
            RepoTRBirthdayPray repo,
            RepoMasterDonatur donaturRepo,
            RepoApplicationSetting settingRepo,
            IWebHostEnvironment env,
            IConfiguration configuration)
        {
            this.conn = conn;
            this.repo = repo;
            this.donaturRepo = donaturRepo;
            this.settingRepo = settingRepo;
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
                    response.data.pathPesanSuaraUrl = BuildPublicAssetUrl(response.data.pathPesanSuara);
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
                    item.pathPesanSuaraUrl = BuildPublicAssetUrl(item.pathPesanSuara);
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
                string resolvedUrl = BuildAbsoluteUrl(publicBaseUrl, prayData.pathPesanSuara);
                var publicBaseUrlValidation = ValidatePublicBaseUrl(publicBaseUrl);

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
                        voiceStorageRootPath = GetVoiceStorageRootPath(),
                        voiceStorageEnvironmentFolder = GetVoiceStorageEnvironmentFolder(),
                        pathPesanSuara = prayData.pathPesanSuara ?? "",
                        pathPesanSuaraUrl = BuildPublicAssetUrl(prayData.pathPesanSuara),
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
                if (bodyRequest.pesanSuaraFile != null && bodyRequest.pesanSuaraFile.Length > 0)
                {
                    if (!IsSupportedAudioFile(bodyRequest.pesanSuaraFile))
                    {
                        tran.Rollback();
                        return new ResponseData<long>
                        {
                            success = false,
                            message = "File pesan suara harus berformat MP3 atau WAV.",
                            data = 0
                        };
                    }

                    pathPesanSuara = SaveVoiceFile(bodyRequest.pesanSuaraFile, donatur.Nama, birthdayDate);
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
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "File pesan suara wajib diisi.",
                        data = 0
                    };
                }

                if (!IsSupportedAudioFile(bodyRequest.pesanSuaraFile))
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "File pesan suara harus berformat MP3 atau WAV.",
                        data = 0
                    };
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

                string pathPesanSuara = SaveVoiceFile(bodyRequest.pesanSuaraFile, donatur.Nama, birthdayDate);

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

        public async Task<ResponseData<string>> SendWhatsApp(long idDonatur, int? year = null)
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
                    return new ResponseData<string> { success = false, message = "Data birthday pray tidak ditemukan." };
                }

                if (string.IsNullOrWhiteSpace(prayData.noHPDonatur))
                {
                    return new ResponseData<string> { success = false, message = "Nomor HP donatur tidak tersedia." };
                }

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";
                string publicBaseUrl = GetPublicBaseUrl();

                if (string.IsNullOrWhiteSpace(gatewayUrl))
                {
                    return new ResponseData<string> { success = false, message = "WhatsApp gateway URL belum diatur." };
                }

                if (!string.IsNullOrWhiteSpace(prayData.pathPesanSuara) && string.IsNullOrWhiteSpace(publicBaseUrl))
                {
                    return new ResponseData<string>
                    {
                        success = false,
                        message = "Runtime.PublicBaseUrl belum diatur untuk mengirim pesan suara."
                    };
                }

                if (!string.IsNullOrWhiteSpace(prayData.pathPesanSuara))
                {
                    var publicBaseUrlValidation = ValidatePublicBaseUrl(publicBaseUrl);
                    if (!publicBaseUrlValidation.isValid)
                    {
                        return new ResponseData<string>
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
                            string audioUrl = BuildAbsoluteUrl(publicBaseUrl, prayData.pathPesanSuara);
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

                    return new ResponseData<string>
                    {
                        success = true,
                        message = "Pesan WhatsApp berhasil dikirim.",
                        data = responseBody
                    };
                }

                return new ResponseData<string>
                {
                    success = false,
                    message = $"Gagal mengirim WhatsApp ({response.StatusCode}): {responseBody}",
                    data = responseBody
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<string> { success = false, message = ex.Message };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public async Task<ResponseData<string>> SendTestWhatsAppText(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;
            try
            {
                if (conn.State == ConnectionState.Closed) conn.Open();
                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || prayData.id_donatur <= 0)
                    return new ResponseData<string> { success = false, message = "Data tidak ditemukan." };

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
            catch (Exception ex) { return new ResponseData<string> { success = false, message = ex.Message }; }
            finally { if (conn.State == ConnectionState.Open) conn.Close(); }
        }

        public async Task<ResponseData<string>> SendTestWhatsAppVoice(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;
            try
            {
                if (conn.State == ConnectionState.Closed) conn.Open();
                var prayData = repo.GetDataByDonaturId(idDonatur, targetYear, conn).data;
                if (prayData == null || string.IsNullOrWhiteSpace(prayData.pathPesanSuara))
                    return new ResponseData<string> { success = false, message = "Data suara tidak ditemukan." };

                string gatewayUrl = configuration["WhatsAppGateway:Url"] ?? "";
                string gatewayToken = configuration["WhatsAppGateway:Token"] ?? "";
                string publicBaseUrl = GetPublicBaseUrl();
                if (string.IsNullOrWhiteSpace(publicBaseUrl))
                    return new ResponseData<string> { success = false, message = "Runtime.PublicBaseUrl belum diatur untuk test pesan suara." };
                var publicBaseUrlValidation = ValidatePublicBaseUrl(publicBaseUrl);
                if (!publicBaseUrlValidation.isValid)
                    return new ResponseData<string> { success = false, message = $"Runtime.PublicBaseUrl belum bisa diakses public untuk gateway pihak ketiga. {publicBaseUrlValidation.message}" };
                string phoneNumber = FormatPhoneNumber(prayData.noHPDonatur);
                string audioUrl = BuildAbsoluteUrl(publicBaseUrl, prayData.pathPesanSuara);

                var payload = new
                {
                    phone_number = phoneNumber,
                    channel = "whatsapp",
                    message_type = "audio",
                    media_url = audioUrl
                };

                return await PostToGateway(gatewayUrl, gatewayToken, payload);
            }
            catch (Exception ex) { return new ResponseData<string> { success = false, message = ex.Message }; }
            finally { if (conn.State == ConnectionState.Open) conn.Close(); }
        }

        public async Task<ResponseData<string>> GetWhatsAppPhoneNumbers()
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

                return new ResponseData<string>
                {
                    success = response.IsSuccessStatusCode,
                    message = response.IsSuccessStatusCode ? "Berhasil mengambil data nomor" : $"Gateway Error: {response.StatusCode}",
                    data = body
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<string> { success = false, message = ex.Message };
            }
        }

        private string FormatPhoneNumber(string raw)
        {
            string cleaned = raw.Replace("+", "").Replace("-", "").Replace(" ", "");
            if (cleaned.StartsWith("0")) return "62" + cleaned.Substring(1);
            if (!cleaned.StartsWith("62")) return "62" + cleaned;
            return cleaned;
        }

        private async Task<ResponseData<string>> PostToGateway(string url, string token, object payload)
        {
            using var client = new HttpClient();
            if (!string.IsNullOrWhiteSpace(token))
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var response = await client.PostAsync(url, content);
            string body = await response.Content.ReadAsStringAsync();

            return new ResponseData<string>
            {
                success = response.IsSuccessStatusCode,
                message = response.IsSuccessStatusCode ? "Test Berhasil Terkirim" : $"Gateway Error: {response.StatusCode}",
                data = body
            };
        }

        private string GetPublicBaseUrl()
        {
            return (configuration["Runtime:PublicBaseUrl"] ?? "").Trim();
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

        private string BuildPublicAssetUrl(string relativePath)
        {
            return BuildAbsoluteUrl(GetPublicBaseUrl(), relativePath);
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

        private string SaveVoiceFile(IFormFile file, string donaturName, DateTime birthdayDate)
        {
            string extension = Path.GetExtension(file.FileName ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(extension)) extension = ".mp3";

            string safeName = SanitizeFileName(donaturName);
            string fileName = $"{birthdayDate:yyyyMMdd}_{safeName}_{DateTime.Now:HHmmssfff}{extension}";

            string folder = GetVoiceStoragePhysicalFolder();
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            string filePath = Path.Combine(folder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return BuildStoredVoiceRelativePath(fileName);
        }

        private bool IsSupportedAudioFile(IFormFile file)
        {
            string extension = Path.GetExtension(file.FileName ?? "").Trim().ToLowerInvariant();
            return extension == ".mp3" || extension == ".wav";
        }

        private string SanitizeFileName(string value)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            string safe = new string(value.Where(c => !invalidChars.Contains(c)).ToArray()).Trim();
            return string.IsNullOrWhiteSpace(safe) ? "donatur" : safe.Replace(" ", "_");
        }
    }
}
