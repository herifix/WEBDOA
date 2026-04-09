using API.Repository.global;
using Dapper;
using System.Data;

internal interface iRepoMasterDonatur
{
    ResponseData<List<ResponseModeMasterDonatur>> GetDataByName(string name, IDbConnection conn);
    ResponseData<List<ResponseModeMasterDonatur>> GetDataByTgl(DateTime tgl, IDbConnection conn);
    bool IsDuplicateNamaDanTglLahir(string nama, DateTime? tglLahir, IDbConnection conn, IDbTransaction? tran = null, long? excludeIdDonatur = null);
    int Create(RequestCreateMasterDonatur bodyRequest, IDbConnection conn, IDbTransaction tran);
    void Update(RequestUpdateMasterDonatur bodyRequest, IDbConnection conn, IDbTransaction tran);
    void Delete(long idDonatur, IDbConnection conn, IDbTransaction tran);
    ResponseData<ResponseModeMasterDonatur> GetDataById(long idDonatur, IDbConnection conn, IDbTransaction? tran = null);
    PagedResponse<ResponseModeMasterDonatur> GetAll(RequestGetAllMasterDonatur request, IDbConnection conn);
}

public class RepoMasterDonatur : iRepoMasterDonatur
{
    public ResponseData<List<ResponseModeMasterDonatur>> GetDataByName(string name, IDbConnection conn)
    {
        ResponseData<List<ResponseModeMasterDonatur>> resp = new ResponseData<List<ResponseModeMasterDonatur>>()
        {
            data = new List<ResponseModeMasterDonatur>()
        };

        const string sql = @"SELECT id_donatur, Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation
                             FROM Donatur
                             WHERE nama LIKE '%' + @name + '%'";

        var rows = conn.Query<ResponseModeMasterDonatur>(sql, new { name });

        if (rows != null)
        {
            resp.success = true;
            resp.data = rows.ToList();
        }
        else
        {
            resp.success = false;
            resp.message = "Data not found";
        }

        return resp;
    }

    public ResponseData<List<ResponseModeMasterDonatur>> GetDataByTgl(DateTime tgl, IDbConnection conn)
    {
        ResponseData<List<ResponseModeMasterDonatur>> resp = new ResponseData<List<ResponseModeMasterDonatur>>()
        {
            data = new List<ResponseModeMasterDonatur>()
        };

        try
        {
            const string sql = @"
                SELECT id_donatur, Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation
                FROM Donatur
                WHERE TglLahir IS NOT NULL
                  AND MONTH(TglLahir) = MONTH(@tgl)
                  AND DAY(TglLahir) = DAY(@tgl)
                ORDER BY Nama";

            var rows = conn.Query<ResponseModeMasterDonatur>(sql, new { tgl }).ToList();

            resp.success = true;
            resp.message = rows.Any() ? "OK" : "Data not found";
            resp.data = rows;
        }
        catch (Exception ex)
        {
            resp.success = false;
            resp.message = ex.Message;
        }

        return resp;
    }

    public bool IsDuplicateNamaDanTglLahir(string nama, DateTime? tglLahir, IDbConnection conn, IDbTransaction? tran = null, long? excludeIdDonatur = null)
    {
        const string sql = @"
            SELECT COUNT(1)
            FROM Donatur
            WHERE UPPER(LTRIM(RTRIM(Nama))) = UPPER(LTRIM(RTRIM(@nama)))
              AND (
                    (@tglLahir IS NULL AND TglLahir IS NULL)
                    OR CAST(TglLahir AS date) = CAST(@tglLahir AS date)
                  )
              AND (@excludeIdDonatur IS NULL OR id_donatur <> @excludeIdDonatur)";

        int count = conn.ExecuteScalar<int>(sql, new
        {
            nama,
            tglLahir,
            excludeIdDonatur
        }, tran);

        return count > 0;
    }

    public int Create(RequestCreateMasterDonatur bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            INSERT INTO Donatur (Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation)
            OUTPUT inserted.id_donatur
            VALUES (@nama, @tglLahir, GETDATE(), @nohp, @status, @lastDonation)";

        return conn.ExecuteScalar<int>(sql, new
        {
            nama = bodyRequest.nama,
            tglLahir = bodyRequest.tglLahir,
            nohp = bodyRequest.nohp,
            status = bodyRequest.status,
            lastDonation = bodyRequest.lastDonation
        }, tran);
    }

    public void Update(RequestUpdateMasterDonatur bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            UPDATE Donatur SET
                Nama = @nama,
                TglLahir = @tglLahir,
                NoHP = @nohp,
                Status = @status,
                LastDonation = @lastDonation
            WHERE id_donatur = @idDonatur";

        conn.Execute(sql, new
        {
            idDonatur = bodyRequest.idDonatur,
            nama = bodyRequest.nama,
            tglLahir = bodyRequest.tglLahir,
            nohp = bodyRequest.nohp,
            status = bodyRequest.status,
            lastDonation = bodyRequest.lastDonation
        }, tran);
    }

    public void Delete(long idDonatur, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"DELETE Donatur WHERE id_donatur = @idDonatur";

        conn.Execute(sql, new { idDonatur }, tran);
    }

    public ResponseData<ResponseModeMasterDonatur> GetDataById(long idDonatur, IDbConnection conn, IDbTransaction? tran = null)
    {
        ResponseData<ResponseModeMasterDonatur> resp = new ResponseData<ResponseModeMasterDonatur>()
        {
            data = new ResponseModeMasterDonatur()
        };

        const string sql = @"SELECT id_donatur, Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation
                             FROM Donatur
                             WHERE id_donatur = @idDonatur";

        var row = conn.QuerySingleOrDefault<ResponseModeMasterDonatur>(sql, new { idDonatur }, tran);

        if (row != null)
        {
            resp.success = true;
            resp.message = "OK";
            resp.data = row;
        }
        else
        {
            resp.success = false;
            resp.message = "Data not found";
        }

        return resp;
    }

    public PagedResponse<ResponseModeMasterDonatur> GetAll(RequestGetAllMasterDonatur request, IDbConnection conn)
    {
        var resp = new PagedResponse<ResponseModeMasterDonatur>();

        int pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        int pageSize = request.PageSize <= 0 ? 10 : request.PageSize;
        int offset = (pageNumber - 1) * pageSize;

        const string sqlCount = @"
            SELECT COUNT(1)
            FROM Donatur a
            WHERE (@Search = ''
                   OR a.Nama LIKE '%' + @Search + '%'
                   OR a.NoHP LIKE '%' + @Search + '%')";

        const string sqlData = @"
            SELECT a.id_donatur, a.Nama, a.TglLahir, a.CreatedDate, a.NoHP, a.Status, a.LastDonation
            FROM Donatur a
            WHERE (@Search = ''
                   OR a.Nama LIKE '%' + @Search + '%'
                   OR a.NoHP LIKE '%' + @Search + '%')
            ORDER BY a.Nama
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        int totalRecords = conn.ExecuteScalar<int>(sqlCount, new
        {
            Search = request.Search ?? ""
        });

        var rows = conn.Query<ResponseModeMasterDonatur>(sqlData, new
        {
            Search = request.Search ?? "",
            Offset = offset,
            PageSize = pageSize
        }).ToList();

        resp.success = true;
        resp.message = rows.Any() ? "OK" : "Data not found";
        resp.data = rows;
        resp.pageNumber = pageNumber;
        resp.pageSize = pageSize;
        resp.totalRecords = totalRecords;
        resp.totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling((double)totalRecords / pageSize);

        return resp;
    }
}
