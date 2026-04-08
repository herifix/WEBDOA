using API.Repository.global;
using Dapper;
using System.Data;
using System.Linq;

internal interface iRepoMasterUser
{
    ResponseData<ResponseModelMasterUser> GetDataById(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null);
    PagedResponse<ResponseModelMasterUser> GetAll(RequestGetAllMasterUser request, IDbConnection conn);
    List<ResponseModelMasterUserPermission> GetMenuPermissions(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null);
    void Create(RequestCreateMasterUser bodyRequest, IDbConnection conn, IDbTransaction tran);
    void Update(RequestUpdateMasterUser bodyRequest, IDbConnection conn, IDbTransaction tran);
    void Delete(string pt, string userid, IDbConnection conn, IDbTransaction tran);
    void ReplaceMenuPermissions(string pt, string userid, IEnumerable<RequestMasterUserPermissionItem> permissions, IDbConnection conn, IDbTransaction tran);
    bool IsExists(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null);
    bool IsPasswordMatch(string pt, string userid, string password, IDbConnection conn, IDbTransaction? tran = null);
    void ChangePassword(string pt, string userid, string newPassword, IDbConnection conn, IDbTransaction tran);
    string GetStoredPassword(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null);
}

public class RepoMasterUser : iRepoMasterUser
{
    public ResponseData<ResponseModelMasterUser> GetDataById(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null)
    {
        var response = new ResponseData<ResponseModelMasterUser>
        {
            data = new ResponseModelMasterUser()
        };

        const string sql = @"
            SELECT
                ISNULL(PT, '') AS pt,
                ISNULL(UserID, '') AS userid,
                ISNULL(Nama, '') AS nama,
                ISNULL(Lvl, 0) AS lvl,
                '' AS kunci,
                ISNULL(GantiKunci, 0) AS gantiKunci
            FROM KeyUser
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        var row = conn.QuerySingleOrDefault<ResponseModelMasterUser>(sql, new { pt, userid }, tran);

        if (row != null && !string.IsNullOrWhiteSpace(row.userid))
        {
            response.success = true;
            response.message = "OK";
            response.data = row;
        }
        else
        {
            response.success = false;
            response.message = "Data not found";
        }

        return response;
    }

    public PagedResponse<ResponseModelMasterUser> GetAll(RequestGetAllMasterUser request, IDbConnection conn)
    {
        var response = new PagedResponse<ResponseModelMasterUser>();
        int pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        int pageSize = request.PageSize <= 0 ? 10 : request.PageSize;
        int offset = (pageNumber - 1) * pageSize;

        const string sqlCount = @"
            SELECT COUNT(1)
            FROM KeyUser
            WHERE @search = ''
               OR ISNULL(PT, '') LIKE '%' + @search + '%'
               OR ISNULL(UserID, '') LIKE '%' + @search + '%'
               OR ISNULL(Nama, '') LIKE '%' + @search + '%'";

        const string sqlData = @"
            SELECT
                ISNULL(PT, '') AS pt,
                ISNULL(UserID, '') AS userid,
                ISNULL(Nama, '') AS nama,
                ISNULL(Lvl, 0) AS lvl,
                '' AS kunci,
                ISNULL(GantiKunci, 0) AS gantiKunci
            FROM KeyUser
            WHERE @search = ''
               OR ISNULL(PT, '') LIKE '%' + @search + '%'
               OR ISNULL(UserID, '') LIKE '%' + @search + '%'
               OR ISNULL(Nama, '') LIKE '%' + @search + '%'
            ORDER BY ISNULL(PT, ''), ISNULL(UserID, '')
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY";

        int totalRecords = conn.ExecuteScalar<int>(sqlCount, new { search = request.Search ?? "" });
        var rows = conn.Query<ResponseModelMasterUser>(sqlData, new
        {
            search = request.Search ?? "",
            offset,
            pageSize
        }).ToList();

        response.success = true;
        response.message = rows.Any() ? "OK" : "Data not found";
        response.data = rows;
        response.pageNumber = pageNumber;
        response.pageSize = pageSize;
        response.totalRecords = totalRecords;
        response.totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling((double)totalRecords / pageSize);

        return response;
    }

    public List<ResponseModelMasterUserPermission> GetMenuPermissions(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            DECLARE @id_user BIGINT = ISNULL((
                SELECT TOP 1 ISNULL(id_user, 0)
                FROM KeyUser
                WHERE ISNULL(PT, '') = @pt
                  AND ISNULL(UserID, '') = @userid
            ), 0);

            SELECT *
            FROM (
                SELECT
                    ISNULL(t.id_form, 0) AS id_form,
                    ISNULL(f.FormName, '') AS formName,
                    ISNULL(t.id_menu_parent, 0) AS id_menu_parent,
                    ISNULL(t.Lvl, 0) AS lvl,
                    ISNULL(t.MenuOrder, 0) AS menuOrder,
                    CAST(ISNULL(t.AsParent, 0) AS bit) AS asParent,
                    CAST(CASE WHEN ISNULL(mu.[VIEW], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canView,
                    CAST(CASE WHEN ISNULL(mu.[ADD], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canAdd,
                    CAST(CASE WHEN ISNULL(mu.[EDIT], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canEdit,
                    CAST(CASE WHEN ISNULL(mu.[PRINT], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canPrint,
                    CAST(CASE WHEN ISNULL(mu.[DEL], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canDelete
                FROM MsMenuTree t
                LEFT JOIN MsForm f ON f.id_form = t.id_form
                LEFT JOIN MsMenuUser mu ON mu.id_user = @id_user AND mu.id_form = t.id_form

                UNION ALL

                SELECT
                    ISNULL(b.id_form, 0) AS id_form,
                    ISNULL(b.FormName, '') AS formName,
                    0 AS id_menu_parent,
                    1 AS lvl,
                    999 AS menuOrder,
                    CAST(0 AS bit) AS asParent,
                    CAST(CASE WHEN ISNULL(a.[VIEW], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canView,
                    CAST(CASE WHEN ISNULL(a.[ADD], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canAdd,
                    CAST(CASE WHEN ISNULL(a.[EDIT], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canEdit,
                    CAST(CASE WHEN ISNULL(a.[PRINT], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canPrint,
                    CAST(CASE WHEN ISNULL(a.[DEL], 0) <> 0 THEN 1 ELSE 0 END AS bit) AS canDelete
                FROM MsForm b
                LEFT JOIN MsMenuUser a ON a.id_user = @id_user AND a.id_form = b.id_form
                WHERE b.id_form NOT IN (SELECT c.id_form FROM MsMenuTree c)
            ) z
            ORDER BY ISNULL(lvl, 0), ISNULL(menuOrder, 0), ISNULL(id_form, 0)";

        var flatRows = conn.Query<MasterUserPermissionFlatRow>(sql, new
        {
            pt = pt ?? "",
            userid = userid ?? ""
        }, tran).ToList();

        if (!flatRows.Any())
        {
            return new List<ResponseModelMasterUserPermission>();
        }

        var lookup = flatRows.ToDictionary(
            item => item.id_form,
            item => new MasterUserPermissionNode
            {
                id_form = item.id_form,
                formName = string.IsNullOrWhiteSpace(item.formName) ? $"Menu {item.id_form}" : item.formName,
                id_menu_parent = item.id_menu_parent,
                lvl = item.lvl,
                menuOrder = item.menuOrder,
                asParent = item.asParent,
                canView = item.canView,
                canAdd = item.canAdd,
                canEdit = item.canEdit,
                canPrint = item.canPrint,
                canDelete = item.canDelete
            }
        );

        var roots = new List<MasterUserPermissionNode>();

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

        var result = new List<ResponseModelMasterUserPermission>();
        FlattenPermissionNodes(
            roots.OrderBy(x => x.menuOrder).ThenBy(x => x.id_form).ToList(),
            result,
            new List<string>(),
            "");

        return result;
    }

    public void Create(RequestCreateMasterUser bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            INSERT INTO KeyUser (PT, UserID, Nama, Lvl, Kunci, GantiKunci)
            VALUES (@pt, @userid, @nama, @lvl, @kunci, @gantiKunci)";

        conn.Execute(sql, new
        {
            pt = bodyRequest.pt ?? "",
            userid = bodyRequest.userid ?? "",
            nama = bodyRequest.nama ?? "",
            lvl = bodyRequest.lvl ?? 0,
            kunci = bodyRequest.kunci ?? "",
            gantiKunci = bodyRequest.gantiKunci
        }, tran);
    }

    public void Update(RequestUpdateMasterUser bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            UPDATE KeyUser
            SET
                Nama = @nama,
                Lvl = @lvl,
                Kunci = CASE WHEN @kunci = '' THEN Kunci ELSE @kunci END,
                GantiKunci = @gantiKunci
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        conn.Execute(sql, new
        {
            pt = bodyRequest.pt ?? "",
            userid = bodyRequest.userid ?? "",
            nama = bodyRequest.nama ?? "",
            lvl = bodyRequest.lvl ?? 0,
            kunci = bodyRequest.kunci ?? "",
            gantiKunci = bodyRequest.gantiKunci
        }, tran);
    }

    public void ReplaceMenuPermissions(string pt, string userid, IEnumerable<RequestMasterUserPermissionItem> permissions, IDbConnection conn, IDbTransaction tran)
    {
        const string sqlGetUserId = @"
            SELECT TOP 1 ISNULL(id_user, 0)
            FROM KeyUser
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        long idUser = conn.ExecuteScalar<long>(sqlGetUserId, new { pt, userid }, tran);

        const string sqlDelete = @"
            DELETE FROM MsMenuUser
            WHERE id_user = @idUser";

        conn.Execute(sqlDelete, new { idUser }, tran);

        var rowsToInsert = permissions
            .Where(item => item.id_form > 0)
            .Where(item => item.canView || item.canAdd || item.canEdit || item.canPrint || item.canDelete)
            .Select(item => new
            {
                idUser,
                idForm = item.id_form,
                canView = item.canView,
                canAdd = item.canAdd,
                canEdit = item.canEdit,
                canPrint = item.canPrint,
                canDelete = item.canDelete
            })
            .ToList();

        if (!rowsToInsert.Any())
        {
            return;
        }

        const string sqlInsert = @"
            INSERT INTO MsMenuUser (id_user, id_form, id_menu, [VIEW], [ADD], [EDIT], [PRINT], [DEL])
            VALUES (@idUser, @idForm, 0, @canView, @canAdd, @canEdit, @canPrint, @canDelete)";

        conn.Execute(sqlInsert, rowsToInsert, tran);
    }

    public void Delete(string pt, string userid, IDbConnection conn, IDbTransaction tran)
    {
        const string sqlDeletePermission = @"
            DELETE mu
            FROM MsMenuUser mu
            INNER JOIN KeyUser ku ON ku.id_user = mu.id_user
            WHERE ISNULL(ku.PT, '') = @pt
              AND ISNULL(ku.UserID, '') = @userid";

        conn.Execute(sqlDeletePermission, new { pt, userid }, tran);

        const string sql = @"
            DELETE FROM KeyUser
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        conn.Execute(sql, new { pt, userid }, tran);
    }

    public bool IsExists(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM KeyUser
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        return conn.ExecuteScalar<int>(sql, new { pt, userid }, tran) > 0;
    }

    public bool IsPasswordMatch(string pt, string userid, string password, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM KeyUser
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid
              AND ISNULL(Kunci, '') = @password";

        return conn.ExecuteScalar<int>(sql, new { pt, userid, password }, tran) > 0;
    }

    public void ChangePassword(string pt, string userid, string newPassword, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            UPDATE KeyUser
            SET
                Kunci = @newPassword,
                GantiKunci = 0
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        conn.Execute(sql, new { pt, userid, newPassword }, tran);
    }

    public string GetStoredPassword(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            SELECT ISNULL(Kunci, '')
            FROM KeyUser
            WHERE ISNULL(PT, '') = @pt
              AND ISNULL(UserID, '') = @userid";

        return conn.ExecuteScalar<string>(sql, new { pt, userid }, tran) ?? "";
    }

    private static void FlattenPermissionNodes(
        List<MasterUserPermissionNode> nodes,
        List<ResponseModelMasterUserPermission> result,
        List<string> parentLabels,
        string parentCode)
    {
        for (int index = 0; index < nodes.Count; index++)
        {
            var node = nodes[index];
            string positionCode = string.IsNullOrWhiteSpace(parentCode)
                ? $"{index + 1}"
                : $"{parentCode}.{index + 1}";

            var labels = parentLabels.Append(node.formName).ToList();

            result.Add(new ResponseModelMasterUserPermission
            {
                id_form = node.id_form,
                formName = node.formName,
                id_menu_parent = node.id_menu_parent,
                lvl = node.lvl,
                menuOrder = node.menuOrder,
                asParent = node.asParent,
                positionCode = positionCode,
                positionLabel = string.Join(" > ", labels),
                canView = node.canView,
                canAdd = node.canAdd,
                canEdit = node.canEdit,
                canPrint = node.canPrint,
                canDelete = node.canDelete
            });

            if (node.children.Count > 0)
            {
                FlattenPermissionNodes(
                    node.children.OrderBy(x => x.menuOrder).ThenBy(x => x.id_form).ToList(),
                    result,
                    labels,
                    positionCode);
            }
        }
    }

    private sealed class MasterUserPermissionFlatRow
    {
        public long id_form { get; set; }
        public string formName { get; set; } = "";
        public long id_menu_parent { get; set; }
        public int lvl { get; set; }
        public int menuOrder { get; set; }
        public bool asParent { get; set; }
        public bool canView { get; set; }
        public bool canAdd { get; set; }
        public bool canEdit { get; set; }
        public bool canPrint { get; set; }
        public bool canDelete { get; set; }
    }

    private sealed class MasterUserPermissionNode
    {
        public long id_form { get; set; }
        public string formName { get; set; } = "";
        public long id_menu_parent { get; set; }
        public int lvl { get; set; }
        public int menuOrder { get; set; }
        public bool asParent { get; set; }
        public bool canView { get; set; }
        public bool canAdd { get; set; }
        public bool canEdit { get; set; }
        public bool canPrint { get; set; }
        public bool canDelete { get; set; }
        public List<MasterUserPermissionNode> children { get; set; } = new();
    }
}
