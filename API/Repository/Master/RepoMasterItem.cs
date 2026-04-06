using API.Repository.global;
using Dapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.SqlClient;
using System.Data;

internal interface iRepoMasterItem
{
    ResponseData<List<ResponseModelItemMaster>> GetDataByName(string name, IDbConnection conn);
    ResponseData<ResponseModelItemMaster> GetDataByCode(string code, IDbConnection conn, IDbTransaction? tran = null);
    int CreateItemMaster(RequestCreateMasterItem bodyRequest, IDbConnection conn);
    public void UpdateItemMaster(RequestUpdateMasterItem bodyRequest, IDbConnection conn, IDbTransaction tran);
    public PagedResponse<ResponseModelItemMaster> GetAll(RequestGetAllItemMaster request, IDbConnection conn);
}

public class RepoMasterItem : iRepoMasterItem
{
    public ResponseData<List<ResponseModelItemMaster>> GetDataByName(string name, IDbConnection conn)
    {
        ResponseData<List<ResponseModelItemMaster>> resp = new ResponseData<List<ResponseModelItemMaster>>()
        {
            data = new List<ResponseModelItemMaster>()
        };

        const string sql = @$"SELECT a.Kode code, a.Nama name,kode_satuan baseunitcode, b.nama baseunitname,a.kode_kelas classcode
                            , C.nama classname, a.img1
                                FROM Ktr_psd a
                                left join Satuan b on  b.kode=a.kode_satuan AND b.kode_area = a.kode_area
                                left join Kelas C on  C.kode=a.kode_kelas AND c.kode_area = a.kode_area
                                WHERE a.Kode like '%' + @name + '%' and a.kode_area='{Variables.userarea}'";

        var rows =  conn.Query<ResponseModelItemMaster>(sql, new { name });

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

    public ResponseData<ResponseModelItemMaster> GetDataByCode(string code, IDbConnection conn, IDbTransaction? tran = null)
    {
        ResponseData<ResponseModelItemMaster> resp = new ResponseData<ResponseModelItemMaster>()
        {
            data = new ResponseModelItemMaster()
        };

        const string sql = @$"SELECT a.Kode code, a.Nama name,kode_satuan baseunitcode, b.nama baseunitname,a.kode_kelas classcode
                            , C.nama classname, a.img1,activedate,a.id_Item iditem
                                FROM Ktr_psd a
                                left join Satuan b on  b.kode=a.kode_satuan AND b.kode_area = a.kode_area
                                left join Kelas C on  C.kode=a.kode_kelas AND c.kode_area = a.kode_area
                                WHERE a.Kode =@code and a.kode_area='{Variables.userarea}'";

        ResponseModelItemMaster rows = conn.QuerySingleOrDefault<ResponseModelItemMaster>(sql, new { code }, tran);

        if (rows != null)
        {
            resp.success = true;
            resp.data = rows;
        }else
        {
            resp.success = false;
            resp.message = "Data not found";
        }
        return resp;

    }

    public int CreateItemMaster(RequestCreateMasterItem bodyRequest, IDbConnection conn)
    {
        string sql = @"INSERT INTO Ktr_psd 
                           (Kode, Nama, Kode_Kelas,img1 EntryDate,UserID)
                           OUTPUT inserted.id_item
                           VALUES 
                           (@code, @name, @classcode,@img1, GetDate(), @user)";

        return conn.ExecuteScalar<int>(sql, new
        {
            code = bodyRequest.code,
            name = bodyRequest.name,
            classcode =bodyRequest.classcode,
            img1=bodyRequest.img1,
            user =bodyRequest.usercreate
        });
    }

    public void UpdateItemMaster(RequestUpdateMasterItem bodyRequest, IDbConnection conn, IDbTransaction tran)
    {
        string sql = @"Update Ktr_psd set
                           Kode=@code, Nama=@name, Kode_Kelas=@classcode,img1=@img1, LastUpdatedDate=GetDate(),LastUpdatedBy=@user
                           Where id_item =@iditem
                    ";

        conn.Execute(sql, new
        {
            iditem=bodyRequest.iditem,
            code = bodyRequest.code,
            name = bodyRequest.name,
            classcode = bodyRequest.classcode,
            img1 = bodyRequest.img1,
            user = bodyRequest.userupdate
        },tran);
    }

    public PagedResponse<ResponseModelItemMaster> GetAll(RequestGetAllItemMaster request, IDbConnection conn)
    {
        var resp = new PagedResponse<ResponseModelItemMaster>();

        int pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        int pageSize = request.PageSize <= 0 ? 10 : request.PageSize;
        int offset = (pageNumber - 1) * pageSize;

        const string sqlCount = @"
            SELECT COUNT(1)
            FROM Ktr_psd a
            LEFT JOIN Satuan b ON b.kode = a.kode_satuan AND b.kode_area = a.kode_area
            LEFT JOIN Kelas c ON c.kode = a.kode_kelas AND c.kode_area = a.kode_area
            WHERE a.kode_area = @Area
              AND ( @Search = ''
                    OR a.Kode LIKE '%' + @Search + '%'
                    OR a.Nama LIKE '%' + @Search + '%'
                    OR a.kode_kelas LIKE '%' + @Search + '%'
                    OR c.nama LIKE '%' + @Search + '%'
                  );
        ";

        const string sqlData = @"
            SELECT a.Kode AS code, a.Nama AS name, ISNULL(a.img1, '') AS img1, ISNULL(a.kode_kelas, '') AS classcode, ISNULL(c.nama, '') AS classname,
                ISNULL(a.kode_satuan, '') AS baseunitcode, ISNULL(b.nama, '') AS baseunitname, a.activedate,ID_item iditem
            FROM Ktr_psd a
            LEFT JOIN Satuan b ON b.kode = a.kode_satuan AND b.kode_area = a.kode_area
            LEFT JOIN Kelas c ON c.kode = a.kode_kelas AND c.kode_area = a.kode_area
            WHERE a.kode_area = @Area
              AND ( @Search = ''
                    OR a.Kode LIKE '%' + @Search + '%'
                    OR a.Nama LIKE '%' + @Search + '%'
                    OR a.kode_kelas LIKE '%' + @Search + '%'
                    OR c.nama LIKE '%' + @Search + '%'
                  )
            ORDER BY a.Kode
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        ";

        int totalRecords = conn.ExecuteScalar<int>(sqlCount, new
        {
            Area = request.Area,
            Search = request.Search ?? ""
        });

        var rows = conn.Query<ResponseModelItemMaster>(sqlData, new
        {
            Area = request.Area,
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

    //public ResponseData<List<ResponseModelItemMaster>> GetAll(string Area, IDbConnection conn)
    //{
    //    ResponseData<List<ResponseModelItemMaster>> resp = new ResponseData<List<ResponseModelItemMaster>>()
    //    {
    //        data = new List<ResponseModelItemMaster>()
    //    };

    //    const string sql = @$"SELECT a.Kode code, a.Nama name,kode_satuan baseunitcode, b.nama baseunitname,a.kode_kelas classcode
    //                        , C.nama classname, a.img1,activedate
    //                            FROM Ktr_psd a
    //                            left join Satuan b on  b.kode=a.kode_satuan and b.kode_area=a.kode_area
    //                            left join Kelas C on  C.kode=a.kode_kelas and c.kode_area=a.kode_area
    //                            WHERE a.kode_area=@Area";

    //    var rows = conn.Query<ResponseModelItemMaster>(sql, new { Area = Area }).ToList();

    //    if (rows != null)
    //    {
    //        resp.success = true;
    //        resp.data = rows.ToList();
    //    }
    //    else
    //    {
    //        resp.success = false;
    //        resp.message = "Data not found";
    //    }
    //    return resp;


}

