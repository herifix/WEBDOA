using API.Repository.Transaction;
using API.Repository.global;
using Microsoft.AspNetCore.Hosting;
using System.Data;

namespace API.Service.Transaction
{
    public class ServiceTRBuletin
    {
        private readonly IDbConnection conn;
        private readonly RepoTRBuletin repo;
        private readonly IWebHostEnvironment env;

        public ServiceTRBuletin(IDbConnection conn, RepoTRBuletin repo, IWebHostEnvironment env)
        {
            this.conn = conn;
            this.repo = repo;
            this.env = env;
        }

        public ResponseData<List<ResponseModelTRBuletin>> GetDataAll()
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return new ResponseData<List<ResponseModelTRBuletin>>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetDataAll(conn)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<List<ResponseModelTRBuletin>>
                {
                    success = false,
                    message = ex.Message,
                    data = new List<ResponseModelTRBuletin>()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<ResponseModelTRBuletin> GetDataById(long idTRBuletin)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                if (idTRBuletin <= 0)
                {
                    return new ResponseData<ResponseModelTRBuletin>
                    {
                        success = true,
                        message = "OK",
                        data = new ResponseModelTRBuletin
                        {
                            defaultPendoaName = repo.GetDefaultPendoaName(conn)
                        }
                    };
                }

                var data = repo.GetDataById(idTRBuletin, conn);
                if (data.id_buletin <= 0)
                {
                    return new ResponseData<ResponseModelTRBuletin>
                    {
                        success = false,
                        message = "Data tidak ditemukan.",
                        data = new ResponseModelTRBuletin
                        {
                            defaultPendoaName = repo.GetDefaultPendoaName(conn)
                        }
                    };
                }

                if (string.IsNullOrWhiteSpace(data.defaultPendoaName))
                {
                    data.defaultPendoaName = repo.GetDefaultPendoaName(conn);
                }

                return new ResponseData<ResponseModelTRBuletin>
                {
                    success = true,
                    message = "OK",
                    data = data
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelTRBuletin>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelTRBuletin()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<long> Save(RequestSaveTRBuletin request)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();
            string uploadedPathFile = "";

            try
            {
                repo.EnsureTable(conn, tran);

                string description = request.description?.Trim() ?? "";
                string pesanText = request.pesanText?.Trim() ?? "";

                if (string.IsNullOrWhiteSpace(description))
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Description wajib diisi.",
                        data = 0
                    };
                }

                long idTRBuletin = request.id_buletin ?? 0;
                bool isNew = idTRBuletin <= 0;
                var existing = idTRBuletin > 0
                    ? repo.GetDataById(idTRBuletin, conn, tran)
                    : new ResponseModelTRBuletin();

                if (!isNew && existing.id_buletin <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<long>
                    {
                        success = false,
                        message = "Data buletin tidak ditemukan.",
                        data = 0
                    };
                }

                // Logic:
                // 1. Jika existingPathFile = null → Clear attachment (pathFile = ""), hapus file lama
                // 2. Jika existingPathFile != null → Gunakan nilai itu
                //    - Jika ada attachmentFile baru → timpa dengan file baru, hapus file lama
                //    - Jika tanpa attachmentFile → tetap gunakan existingPathFile

                string nextPathFile = "";
                string oldPathFile = existing.pathFile ?? "";

                if (request.existingPathFile == null)
                {
                    // User clear attachment atau tidak ada file dikirim
                    nextPathFile = "";
                }
                else
                {
                    // existingPathFile dikirim (bisa empty string atau ada path)
                    nextPathFile = request.existingPathFile;
                }

                // Jika ada file baru, simpan dan replace pathFile
                if (request.attachmentFile != null && request.attachmentFile.Length > 0)
                {
                    nextPathFile = SaveAttachmentFile(request.attachmentFile);
                    uploadedPathFile = nextPathFile;
                }

                if (isNew)
                {
                    idTRBuletin = repo.Create(description, pesanText, nextPathFile, conn, tran);
                }
                else
                {
                    repo.Update(idTRBuletin, description, pesanText, nextPathFile, conn, tran);
                }

                tran.Commit();

                // Hapus file lama jika:
                // 1. Ada file lama
                // 2. File lama berbeda dengan file baru
                if (!string.IsNullOrWhiteSpace(oldPathFile) &&
                    !string.Equals(oldPathFile, nextPathFile, StringComparison.OrdinalIgnoreCase))
                {
                    DeletePhysicalFile(oldPathFile);
                }

                return new ResponseData<long>
                {
                    success = true,
                    message = isNew ? "TR Buletin berhasil disimpan." : "TR Buletin berhasil diperbarui.",
                    data = idTRBuletin
                };
            }
            catch (Exception ex)
            {
                tran.Rollback();

                if (!string.IsNullOrWhiteSpace(uploadedPathFile))
                {
                    DeletePhysicalFile(uploadedPathFile);
                }

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

        public ResponseData<int> Delete(long idTRBuletin)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                repo.EnsureTable(conn, tran);

                var existing = repo.GetDataById(idTRBuletin, conn, tran);
                if (existing.id_buletin <= 0)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data buletin tidak ditemukan.",
                        data = 0
                    };
                }

                repo.Delete(idTRBuletin, conn, tran);
                tran.Commit();

                DeletePhysicalFile(existing.pathFile);

                return new ResponseData<int>
                {
                    success = true,
                    message = "TR Buletin berhasil dihapus.",
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

        private string SaveAttachmentFile(IFormFile file)
        {
            string extension = Path.GetExtension(file.FileName);
            string safeExtension = string.IsNullOrWhiteSpace(extension) ? ".bin" : extension;
            string safeName = SanitizeFileName(Path.GetFileNameWithoutExtension(file.FileName));
            string fileName = $"buletin_{DateTime.Now:yyyyMMddHHmmssfff}_{safeName}{safeExtension}";

            string folder = Path.Combine(env.WebRootPath, "uploads", "buletin");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            string filePath = Path.Combine(folder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return Path.Combine("uploads", "buletin", fileName).Replace("\\", "/");
        }

        private void DeletePhysicalFile(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                return;
            }

            string relative = relativePath.Replace("/", Path.DirectorySeparatorChar.ToString());
            string fullPath = Path.Combine(env.WebRootPath, relative);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        private string SanitizeFileName(string value)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            string safe = new string(value.Where(c => !invalidChars.Contains(c)).ToArray()).Trim();
            return string.IsNullOrWhiteSpace(safe) ? "attachment" : safe.Replace(" ", "_");
        }
    }
}
