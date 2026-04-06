
using API.Repository.global;
using Dapper;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Data;
using System.Security.Claims;

namespace API.Repository.Reports.BC
{
    public class RepoReportBC
    {
        GlobalProcedure proc = new GlobalProcedure();

        public List<ResponseModelListBC> ListBC(RequestModelListBC BodyRequest, IDbConnection conn, string userid)
        {
            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report List BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report List BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);

            const string sql = @"Exec PrintAPIListBC
                                 @DateFrom,@DateTo,@TypeBCFrom,@TypeBCTo,@ItemFrom,@ItemTo,@Intr,@Area
                                 ";

            var rows = conn.Query<ResponseModelListBC>(sql, 
                new {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    TypeBCFrom = BodyRequest.typebcfrom,
                    TypeBCTo = BodyRequest.typebcto,
                    ItemFrom = BodyRequest.itemfrom,
                    ItemTo = BodyRequest.itemto,
                    Intr = BodyRequest.intr,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }

        public List<ResponseModelPosisisWIP> PosisiWIP(RequestModelPosisiWIP BodyRequest, IDbConnection conn, string userid)
        {
            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report Posisi WIP BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report HistLOG BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);

            const string sql = @"Exec PrintAPIPosisiWIP
                                 @DateFrom,@DateTo,@ItemFrom,@ItemTo,@Area
                                 ";

            var rows = conn.Query<ResponseModelPosisisWIP>(sql,
                new
                {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    ItemFrom = BodyRequest.itemfrom,
                    ItemTo = BodyRequest.itemto,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }

        public List<ResponseModelMutStok> MutasiBB(RequestModelMutStok BodyRequest, IDbConnection conn, string userid)
        {
            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report Mutasi Bahan Baku BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report HistLOG BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);

            const string sql = @"Exec PrintAPIMUTBB
                                 @DateFrom,@DateTo,@ItemFrom,@ItemTo,@Area
                                 ";

            var rows = conn.Query<ResponseModelMutStok>(sql,
                new
                {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    ItemFrom = BodyRequest.itemfrom,
                    ItemTo = BodyRequest.itemto,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }

        public List<ResponseModelMutStok> MutasiFG(RequestModelMutStok BodyRequest, IDbConnection conn, string userid)
        {
            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report Mutasi FG BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report HistLOG BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);


            const string sql = @"Exec PrintAPIMUTFG
                                 @DateFrom,@DateTo,@ItemFrom,@ItemTo,@Area
                                 ";

            var rows = conn.Query<ResponseModelMutStok>(sql,
                new
                {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    ItemFrom = BodyRequest.itemfrom,
                    ItemTo = BodyRequest.itemto,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }

        public List<ResponseModelMutStok> MutasiReject(RequestModelMutStok BodyRequest, IDbConnection conn, string userid)
        {
            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report Mutasi Reject BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report HistLOG BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);


            const string sql = @"Exec PrintAPIMUTReject
                                 @DateFrom,@DateTo,@ItemFrom,@ItemTo,@Area
                                 ";

            var rows = conn.Query<ResponseModelMutStok>(sql,
                new
                {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    ItemFrom = BodyRequest.itemfrom,
                    ItemTo = BodyRequest.itemto,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }

        public List<ResponseModelMutStok> MutasiMSN(RequestModelMutStok BodyRequest, IDbConnection conn,string userid)
        {
            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report Mutasi Mesin BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report HistLOG BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);


            const string sql = @"Exec PrintAPIMUTMSN
                                 @DateFrom,@DateTo,@ItemFrom,@ItemTo,@Area
                                 ";

            var rows = conn.Query<ResponseModelMutStok>(sql,
                new
                {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    ItemFrom = BodyRequest.itemfrom,
                    ItemTo = BodyRequest.itemto,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }

        public List<ResponseModelHistLog> HistLOG(RequestModelHistLog BodyRequest, IDbConnection conn,string userid)
        {

            proc.Addlog(new RequestLog
            {
                Userid = userid,
                Jenistr = "Report HistLOG BC",
                Notr = "-",
                FromModul = "API",
                Act = "Print",
                Ket = $"Print Report HistLOG BC from {BodyRequest.datefrom.ToString("yyyy-MM-dd")} to {BodyRequest.dateto.ToString("yyyy-MM-dd")}",
                Kodearea = BodyRequest.area
            }, conn);

            const string sql = @"Exec PrintAPIHistLog
                                 @DateFrom,@DateTo,@UserID,@NoTR,@Area
                                 ";

            var rows = conn.Query<ResponseModelHistLog>(sql,
                new
                {
                    DateFrom = BodyRequest.datefrom.Date, // .Date -- > 00:00
                    DateTo = BodyRequest.dateto.Date,
                    UserID = BodyRequest.userid,
                    NoTR = BodyRequest.trno,
                    Area = BodyRequest.area
                });
            return rows.ToList();

        }
    }
}
