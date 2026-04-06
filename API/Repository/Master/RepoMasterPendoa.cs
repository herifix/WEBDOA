using API.Repository.global;
using Dapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.SqlClient;
using System.Data;

internal interface iRepoMasterPendoa
{
    public ResponseData<List<ResponseModelMasterPendoa>> GetDataByName(string name, IDbConnection conn);
    int Create(RequestCreateMasterPendoa bodyRequest, IDbConnection conn, IDbTransaction tran);
    public void Update(RequestUpdateMasterPendoa bodyRequest, IDbConnection conn, IDbTransaction tran);
    public void Delate(long id_pendoa, IDbConnection conn, IDbTransaction tran);
    public ResponseData<ResponseModelMasterPendoa> GetDataById(long id_pendoa, IDbConnection conn, IDbTransaction? tran = null);
}

public class RepoMasterPendoa : iRepoMasterPendoa
{
    public ResponseData<List<ResponseModelMasterPendoa>> GetDataByName(string name, IDbConnection conn)
    {
        ResponseData<List<ResponseModelMasterPendoa>> resp = new ResponseData<List<ResponseModelMasterPendoa>>()
        {
            data = new List<ResponseModelMasterPendoa>()
        };

        const string sql = @$"SELECT nama, TglLahir, createddate, nohp, dfl, id_pendoa
                                FROM Pendoa
                                WHERE nama like '%' + @name + '%'";

        var rows = conn.Query<ResponseModelMasterPendoa>(sql, new { name });

        //return rows.ToList();

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

    public int Create(RequestCreateMasterPendoa bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        string sql = @"INSERT INTO Pendoa
                           (Nama, nohp,dfl )
                           OUTPUT inserted.id_pendoa
                           VALUES 
                           (@name, @nohp,@dfl)";

        int a = conn.ExecuteScalar<int>(sql, new
        {
            name = bodyRequest.name,
            nohp = bodyRequest.nohp,
            dfl = bodyRequest.dfl
        });

        if (bodyRequest.dfl) {
            sql = @"Update Pendoa set dfl = 0 where id_pendoa != @idpendoa and dfl = 1";

            conn.ExecuteScalar<int>(sql, new
            {
                idpendoa = a
            });
        }

        return a;
    }

    public void Update(RequestUpdateMasterPendoa bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        string sql = @"Update Pendoa set
                            Nama = @name,
                            nohp = @nohp,
                            dfl = @dfl
                           where id_pendoa = @idpendoa";

        conn.ExecuteScalar<int>(sql, new
        {
            name = bodyRequest.name,
            nohp = bodyRequest.nohp,
            dfl = bodyRequest.dfl,
            idpendoa = bodyRequest.id_pendoa
        }, tran);

        if (bodyRequest.dfl)
        {
            sql = @"Update Pendoa set dfl = 0 where id_pendoa != @idpendoa and dfl = 1";

            conn.ExecuteScalar<int>(sql, new
            {
                idpendoa = bodyRequest.id_pendoa
            });
        }

    }

    public void Delate(long id_pendoa, IDbConnection conn, IDbTransaction tran)
    {
        string sql = @"delete Pendoa where id_pendoa = @idpendoa";

        int a = conn.ExecuteScalar<int>(sql, new
        {
            idpendoa = id_pendoa
        }, tran);

    }

    public ResponseData<ResponseModelMasterPendoa> GetDataById(long id_pendoa, IDbConnection conn, IDbTransaction? tran = null)
    {
        ResponseData<ResponseModelMasterPendoa> resp = new ResponseData<ResponseModelMasterPendoa>()
        {
            data = new ResponseModelMasterPendoa()
        };

        const string sql = @$"SELECT id_pendoa,nama,dfl,nohp,createddate FROM Pendoa a
                                WHERE a.id_pendoa =@idpendoa";

        ResponseModelMasterPendoa rows = conn.QuerySingleOrDefault<ResponseModelMasterPendoa>(sql, new { id_pendoa }, tran);

        if (rows != null)
        {
            resp.success = true;
            resp.data = rows;
        }
        else
        {
            resp.success = false;
            resp.message = "Data not found";
        }
        return resp;

    }

    public PagedResponse<ResponseModelMasterPendoa> GetAll(RequestGetAllMasterPendoa request, IDbConnection conn)
    {
        var resp = new PagedResponse<ResponseModelMasterPendoa>();

        int pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        int pageSize = request.PageSize <= 0 ? 10 : request.PageSize;
        int offset = (pageNumber - 1) * pageSize;

        const string sqlCount = @"
            SELECT COUNT(1)
            FROM Pendoa a
            WHERE ( @Search = ''
                    OR a.nama LIKE '%' + @Search + '%'
                    OR a.nohp LIKE '%' + @Search + '%'
                  );
        ";

        const string sqlData = @"
            SELECT a.Nama AS name, nohp,dfl, createddate, id_pendoa
            FROM Pendoa a
            WHERE ( @Search = ''
                    OR a.nama LIKE '%' + @Search + '%'
                    OR a.nohp LIKE '%' + @Search + '%'
                  )
            ORDER BY a.nama
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        ";

        int totalRecords = conn.ExecuteScalar<int>(sqlCount, new
        {
            Search = request.Search ?? ""
        });

        var rows = conn.Query<ResponseModelMasterPendoa>(sqlData, new
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