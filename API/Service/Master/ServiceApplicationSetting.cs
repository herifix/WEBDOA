using API.Repository.Master;
using API.Repository.global;
using System.Data;

namespace API.Service.Master
{
    public class ServiceApplicationSetting
    {
        private readonly IDbConnection conn;
        private readonly RepoApplicationSetting repo;

        public ServiceApplicationSetting(IDbConnection conn, RepoApplicationSetting repo)
        {
            this.conn = conn;
            this.repo = repo;
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
