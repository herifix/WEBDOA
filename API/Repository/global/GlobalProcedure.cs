using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.global
{
    public class GlobalProcedure
    {

        public void Addlog(RequestLog log, IDbConnection conn)
        {
            globalFunction func = new globalFunction(conn);

            string sql = @"
                Insert into HIstLog (UserId,JenisTR,NoTR,FromModul,Act,Ket,Kode_Area)
                VALUES (@UserId,@JenisTR,@NoTR,@FromModul,@Act,@Ket,@Kode_Area)
                ";
            conn.Execute(sql, new
            {
                UserID = func.isnull(log.Userid),
                JenisTR = log.Jenistr,
                NoTR = log.Notr,
                FromModul = log.FromModul,
                Act = log.Act,
                Ket = log.Ket,
                Kode_Area = log.Kodearea
            }
            );
        }

    }
}
