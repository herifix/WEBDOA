using API.Repository.global;
using System.Data;

namespace API.Service.Master
{
    public class ServiceMasterUser
    {
        private readonly IDbConnection conn;
        private readonly RepoMasterUser repo;

        public ServiceMasterUser(IDbConnection conn, RepoMasterUser repo)
        {
            this.conn = conn;
            this.repo = repo;
        }

        public ResponseData<int> CreateData(RequestCreateMasterUser bodyRequest)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                string pt = (bodyRequest.pt ?? "").Trim();
                string userid = (bodyRequest.userid ?? "").Trim();
                bodyRequest.kunci = EncryptPassword(bodyRequest.kunci);

                if (repo.IsExists(pt, userid, conn, tran))
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "User sudah ada.",
                        data = 0
                    };
                }

                repo.Create(bodyRequest, conn, tran);

                tran.Commit();
                response.success = true;
                response.message = "User created successfully.";
                response.data = 1;
                return response;
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

        public ResponseData<int> UpdateData(RequestUpdateMasterUser bodyRequest)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                string pt = (bodyRequest.pt ?? "").Trim();
                string userid = (bodyRequest.userid ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(bodyRequest.kunci))
                {
                    bodyRequest.kunci = EncryptPassword(bodyRequest.kunci);
                }

                var existing = repo.GetDataById(pt, userid, conn, tran);
                if (!existing.success)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data user tidak ditemukan.",
                        data = 0
                    };
                }

                repo.Update(bodyRequest, conn, tran);

                tran.Commit();
                response.success = true;
                response.message = "User updated successfully.";
                response.data = 1;
                return response;
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

        public ResponseData<int> DeleteData(string pt, string userid)
        {
            var response = new ResponseData<int> { data = 0 };

            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                var existing = repo.GetDataById(pt, userid, conn, tran);
                if (!existing.success)
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Data user tidak ditemukan.",
                        data = 0
                    };
                }

                repo.Delete(pt, userid, conn, tran);

                tran.Commit();
                response.success = true;
                response.message = "User deleted successfully.";
                response.data = 1;
                return response;
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

        public ResponseData<string> ChangePassword(RequestChangePassword bodyRequest)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                string pt = (bodyRequest.pt ?? "").Trim();
                string userid = (bodyRequest.userid ?? "").Trim();
                string currentPassword = bodyRequest.currentPassword ?? "";
                string newPassword = bodyRequest.newPassword ?? "";
                string encryptedCurrentPassword = EncryptPassword(currentPassword);
                string encryptedNewPassword = EncryptPassword(newPassword);

                if (!repo.IsExists(pt, userid, conn, tran))
                {
                    tran.Rollback();
                    return new ResponseData<string>
                    {
                        success = false,
                        message = "Data user tidak ditemukan.",
                        data = ""
                    };
                }

                if (!repo.IsPasswordMatch(pt, userid, encryptedCurrentPassword, conn, tran))
                {
                    tran.Rollback();
                    return new ResponseData<string>
                    {
                        success = false,
                        message = "Password lama tidak sesuai.",
                        data = ""
                    };
                }

                repo.ChangePassword(pt, userid, encryptedNewPassword, conn, tran);

                tran.Commit();
                return new ResponseData<string>
                {
                    success = true,
                    message = "Password berhasil diubah.",
                    data = userid
                };
            }
            catch (Exception ex)
            {
                tran.Rollback();
                return new ResponseData<string>
                {
                    success = false,
                    message = ex.Message,
                    data = ""
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<string> GetCurrentPassword(string pt, string userid)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            try
            {
                if (!repo.IsExists(pt, userid, conn))
                {
                    return new ResponseData<string>
                    {
                        success = false,
                        message = "Data user tidak ditemukan.",
                        data = ""
                    };
                }

                string storedPassword = repo.GetStoredPassword(pt, userid, conn);
                return new ResponseData<string>
                {
                    success = true,
                    message = "OK",
                    data = DecryptPassword(storedPassword)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<string>
                {
                    success = false,
                    message = ex.Message,
                    data = ""
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        private string EncryptPassword(string? password)
        {
            var func = new globalFunction(conn);
            return func.EncPass(password ?? "");
        }

        private string DecryptPassword(string? encryptedPassword)
        {
            var func = new globalFunction(conn);
            return func.DecPass(encryptedPassword ?? "");
        }
    }
}
