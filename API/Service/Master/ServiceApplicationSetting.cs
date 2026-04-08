using API.Repository.Master;
using API.Repository.global;
using System.Data;
using Microsoft.AspNetCore.Hosting;

namespace API.Service.Master
{
    public class ServiceApplicationSetting
    {
        private readonly IDbConnection conn;
        private readonly RepoApplicationSetting repo;
        private readonly IWebHostEnvironment env;

        public ServiceApplicationSetting(IDbConnection conn, RepoApplicationSetting repo, IWebHostEnvironment env)
        {
            this.conn = conn;
            this.repo = repo;
            this.env = env;
        }

        public ResponseData<ResponseModelApplicationSetting> GetSetting()
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return new ResponseData<ResponseModelApplicationSetting>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetSetting(conn)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelApplicationSetting>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelApplicationSetting()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<int> Update(RequestUpdateApplicationSetting request)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                var currentSetting = repo.GetSetting(conn, tran);
                var nextImage = request.existingMsgImage ?? currentSetting.msgImage ?? "";

                if (request.msgImageFile != null && request.msgImageFile.Length > 0)
                {
                    var extension = Path.GetExtension(request.msgImageFile.FileName);
                    var safeExtension = string.IsNullOrWhiteSpace(extension) ? ".png" : extension;
                    var fileName = $"application-setting-{DateTime.Now:yyyyMMddHHmmssfff}{safeExtension}";
                    var folder = Path.Combine(env.WebRootPath, "uploads", "application-setting");

                    if (!Directory.Exists(folder))
                    {
                        Directory.CreateDirectory(folder);
                    }

                    var filePath = Path.Combine(folder, fileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        request.msgImageFile.CopyTo(stream);
                    }

                    nextImage = $"uploads/application-setting/{fileName}";
                }

                request.existingMsgImage = nextImage;
                repo.Upsert(request, conn, tran);
                tran.Commit();

                return new ResponseData<int>
                {
                    success = true,
                    message = "Application setting berhasil disimpan.",
                    data = 1
                };
            }
            catch (Exception ex)
            {
                tran.Rollback();
                return new ResponseData<int>
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
    }
}
