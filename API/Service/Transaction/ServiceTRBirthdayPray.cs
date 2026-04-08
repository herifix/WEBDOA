using API.Repository.global;
using Microsoft.AspNetCore.Hosting;
using System.Data;

namespace API.Service.Transaction
{
    public class ServiceTRBirthdayPray
    {
        private readonly IDbConnection conn;
        private readonly RepoTRBirthdayPray repo;
        private readonly RepoMasterDonatur donaturRepo;
        private readonly IWebHostEnvironment env;

        public ServiceTRBirthdayPray(
            IDbConnection conn,
            RepoTRBirthdayPray repo,
            RepoMasterDonatur donaturRepo,
            IWebHostEnvironment env)
        {
            this.conn = conn;
            this.repo = repo;
            this.donaturRepo = donaturRepo;
            this.env = env;
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

        public ResponseData<ResponseModelTRBirthdayPray> GetDataByDonatur(long idDonatur, int? year = null)
        {
            int targetYear = year ?? DateTime.Today.Year;

            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return repo.GetDataByDonaturId(idDonatur, targetYear, conn);
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

                return new ResponseData<List<ResponseModelTRBirthdayPrayHistory>>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetHistoryByDonaturId(idDonatur, conn)
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

        private DateTime BuildBirthdayDate(DateTime sourceBirthday, int targetYear)
        {
            int day = Math.Min(sourceBirthday.Day, DateTime.DaysInMonth(targetYear, sourceBirthday.Month));
            return new DateTime(targetYear, sourceBirthday.Month, day);
        }

        private string SaveVoiceFile(IFormFile file, string donaturName, DateTime birthdayDate)
        {
            string extension = Path.GetExtension(file.FileName);
            string safeName = SanitizeFileName(donaturName);
            string fileName = $"{birthdayDate:yyyyMMdd}_{safeName}_{DateTime.Now:HHmmssfff}{extension}";

            string folder = Path.Combine(env.WebRootPath, "uploads", "birthday-pray");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            string filePath = Path.Combine(folder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return Path.Combine("uploads", "birthday-pray", fileName).Replace("\\", "/");
        }

        private string SanitizeFileName(string value)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            string safe = new string(value.Where(c => !invalidChars.Contains(c)).ToArray()).Trim();
            return string.IsNullOrWhiteSpace(safe) ? "donatur" : safe.Replace(" ", "_");
        }
    }
}
