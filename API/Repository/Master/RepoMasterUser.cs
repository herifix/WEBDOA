using API.Repository.global;
using Dapper;
using System.Data;

internal interface iRepoMasterUser
{
    ResponseData<ResponseModelMasterUser> GetDataById(string pt, string userid, IDbConnection conn, IDbTransaction? tran = null);
    PagedResponse<ResponseModelMasterUser> GetAll(RequestGetAllMasterUser request, IDbConnection conn);
    void Create(RequestCreateMasterUser bodyRequest, IDbConnection conn, IDbTransaction tran);
    void Update(RequestUpdateMasterUser bodyRequest, IDbConnection conn, IDbTransaction tran);
    void Delete(string pt, string userid, IDbConnection conn, IDbTransaction tran);
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

    public void Delete(string pt, string userid, IDbConnection conn, IDbTransaction tran)
    {
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
}
