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
                SELECT top 1 Userid,pt as Userpt,nama Username,kunci as [Password],lvl Userlvl, ISNULL(GantiKunci, 0) AS GantiKunci
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

        public List<ResponseModelMenuTree> GetSidebarMenu(string userid, string pt)
        {
            const string sql = @"
                DECLARE @id_user BIGINT = (
                    SELECT TOP 1 ISNULL(id_user, 0)
                    FROM KeyUser
                    WHERE ISNULL(UserID, '') = @UserID
                      AND ISNULL(PT, '') = @pt
                );

                SELECT
                    ISNULL(t.id_form, 0) AS id_form,
                    ISNULL(f.FormName, '') AS formName,
                    ISNULL(t.id_menu_parent, 0) AS id_menu_parent,
                    ISNULL(t.Lvl, 0) AS lvl,
                    ISNULL(t.IconType, '') AS iconType,
                    ISNULL(t.MenuOrder, 0) AS menuOrder,
                    CAST(ISNULL(t.AsParent, 0) AS bit) AS asParent,
                    CAST(CASE WHEN ISNULL(mu.[VIEW], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canView,
                    CAST(CASE WHEN ISNULL(mu.[ADD], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canAdd,
                    CAST(CASE WHEN ISNULL(mu.[EDIT], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canEdit,
                    CAST(CASE WHEN ISNULL(mu.[PRINT], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canPrint,
                    CAST(CASE WHEN ISNULL(mu.[DEL], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canDelete
                FROM MsMenuTree t
                LEFT JOIN MsForm f
                    ON f.id_form = t.id_form
                LEFT JOIN MsMenuUser mu
                    ON mu.id_user = @id_user
                   AND mu.id_form = t.id_form
                ORDER BY ISNULL(t.Lvl, 0), ISNULL(t.MenuOrder, 0), ISNULL(t.id_form, 0)";

            var flatRows = conn.Query<ResponseModelMenuTreeFlat>(sql, new
            {
                UserID = userid,
                pt = pt
            }).ToList();

            if (!flatRows.Any())
            {
                return new List<ResponseModelMenuTree>();
            }

            var lookup = flatRows.ToDictionary(
                item => item.id_form,
                item => new ResponseModelMenuTree
                {
                    id_form = item.id_form,
                    formName = item.formName,
                    id_menu_parent = item.id_menu_parent,
                    lvl = item.lvl,
                    iconType = item.iconType,
                    menuOrder = item.menuOrder,
                    asParent = item.asParent,
                    canView = item.canView,
                    canAdd = item.canAdd,
                    canEdit = item.canEdit,
                    canPrint = item.canPrint,
                    canDelete = item.canDelete,
                    children = new List<ResponseModelMenuTree>()
                }
            );

            var roots = new List<ResponseModelMenuTree>();

            foreach (var item in flatRows.OrderBy(x => x.lvl).ThenBy(x => x.menuOrder).ThenBy(x => x.id_form))
            {
                var node = lookup[item.id_form];

                if (item.id_menu_parent > 0 && lookup.TryGetValue(item.id_menu_parent, out var parent))
                {
                    parent.children.Add(node);
                }
                else
                {
                    roots.Add(node);
                }
            }

            return roots
                .OrderBy(x => x.menuOrder)
                .ThenBy(x => x.id_form)
                .ToList();
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
