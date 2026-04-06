using API.Repository.global;
using Azure;
using Dapper;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System;
using System.Data;
using System.Text;
using static System.Net.Mime.MediaTypeNames;

namespace API.Repository.global
{
    public class globalFunctionOutConn
    {
        private readonly IDbConnection conn;
        public globalFunctionOutConn(IDbConnection db)
        {
            conn = db;
        }
        public IEnumerable<ResponsePt> GetAllPT()
        {
            var sql = $@"
            SELECT 
                PT  AS PtCode,
                isnull(Nama,'') AS PtName
            FROM FileData where currentPeriod=1
            ORDER BY PT
        ";

            return conn.Query<ResponsePt>(sql);
        }
    }
        public class globalFunction 
    {
        public const string Intersoft = "IntersoftTeam";
        private readonly IDbConnection conn;
        public globalFunction(IDbConnection DB)
        {
            conn = DB;
        }
        public string isnull(object var)
        {
            if (var == null)
            {
                return "";
            }
            else
            {
                return var.ToString();
            }
        }

        public bool IsUserExists(string userid, string password,string pt)
        {
            string encpass = EncPass(password);
            
            const string sql = @"
                SELECT 1 FROM KeyUser
                WHERE UserID = @UserID
                  AND Kunci  = @Password
                  AND Pt = @pt
                ";

            var result = conn.QueryFirstOrDefault<int?>(sql, new
                {
                    UserID = userid,
                    Password = encpass,
                    pt = pt
                }
            );

            return result.HasValue;
        }

        public ResponseLogin GetDataUser(string userid, string pt)
        {
            const string sql = @"
                SELECT top 1 Userid,pt as Userpt,nama Username,kunci as [Password],lvl Userlvl
                FROM KeyUser
                WHERE UserID = @UserID AND PT = @pt
                ";

            var result = conn.QueryFirstOrDefault<ResponseLogin>(sql, new
            {
                UserID = userid,
                pt = pt
            }
            );

            return result;
        }

        public ResponsePt? GetDataPt(string pt)
        {
            const string sql = @"
                SELECT top 1 PT,Nama,YearPerios YearAktifInv,PeriodGL YearAktifGl
                FROM FileData 
                WHERE PT = @pt and CurrentPeriod=1
                ";

            var result = conn.QueryFirstOrDefault<ResponsePt>(sql, new
            {
                pt = pt
            }
            );

            return result;
        }


        public string EncPass(string pass)
        {
            if (string.IsNullOrEmpty(pass))
                return string.Empty;

            var sb = new StringBuilder(pass.Length * 2);

            for (int i = 0; i < pass.Length; i++)
            {
                int a = (int)pass[i]; // Asc
                int k = (int)Intersoft[i % Intersoft.Length];
                int x = a ^ k;

                // Right$("0" & Hex$(x), 2)
                sb.Append(x.ToString("X2"));
            }

            return sb.ToString();
        }

        public string DecPass(string pass)
        {
            if (string.IsNullOrEmpty(pass))
                return string.Empty;

            var sb = new StringBuilder(pass.Length / 2);

            for (int i = 0; i < pass.Length; i += 2)
            {
                int x = Convert.ToInt32(pass.Substring(i, 2), 16);
                int k = (int)Intersoft[(i / 2) % Intersoft.Length];
                sb.Append((char)(x ^ k));
            }

            return sb.ToString();
        }

        //public string getconnstring(string DB )
        //{
        //    return "server = " + servername + "; database = " + DB + "; user ID = " + uidDB + "; password = " + passDB + "; integrated security = false; TrustServerCertificate=True;";
        //    //return "server = " + servername + "; database = " + DB + "; integrated security = true";
        //}
    }
}
