using API.Repository.Master;
using API.Repository.global;
using System.Data;

namespace API.Service.Master
{
    public class ServiceWhatsAppSchedule
    {
        private readonly IDbConnection conn;
        private readonly RepoWhatsAppSchedule repo;

        public ServiceWhatsAppSchedule(IDbConnection conn, RepoWhatsAppSchedule repo)
        {
            this.conn = conn;
            this.repo = repo;
        }

        public ResponseData<ResponseModelWhatsAppSchedule> GetSetting()
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                return new ResponseData<ResponseModelWhatsAppSchedule>
                {
                    success = true,
                    message = "OK",
                    data = repo.GetSetting(conn)
                };
            }
            catch (Exception ex)
            {
                return new ResponseData<ResponseModelWhatsAppSchedule>
                {
                    success = false,
                    message = ex.Message,
                    data = new ResponseModelWhatsAppSchedule()
                };
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }
        }

        public ResponseData<int> Update(RequestUpdateWhatsAppSchedule request)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            using var tran = conn.BeginTransaction();

            try
            {
                if (!TimeSpan.TryParse(request.sendTime ?? "08:00", out _))
                {
                    tran.Rollback();
                    return new ResponseData<int>
                    {
                        success = false,
                        message = "Format jam tidak valid.",
                        data = 0
                    };
                }

                repo.Upsert(request, conn, tran);
                var data = repo.GetSetting(conn, tran);

                tran.Commit();

                return new ResponseData<int>
                {
                    success = true,
                    message = data.isActive
                        ? $"Penjadwalan WhatsApp aktif pada jam {data.sendTime}."
                        : "Penjadwalan WhatsApp dinonaktifkan.",
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
