using API.Repository.global;
using Dapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.SqlClient;
using System.Data;

internal interface iRepoMasterDonatur
{
    public ResponseData<List<ResponseModeMasterDonatur>> GetDataByName(string name, IDbConnection conn);
    public ResponseData<List<ResponseModeMasterDonatur>> GetDataByTgl(string Tgl, IDbConnection conn);

}

public class RepoMasterDonatur : iRepoMasterDonatur
{
    public ResponseData<List<ResponseModeMasterDonatur>> GetDataByName(string name, IDbConnection conn)
    {
        ResponseData<List<ResponseModeMasterDonatur>> resp = new ResponseData<List<ResponseModeMasterDonatur>>()
        {
            data = new List<ResponseModeMasterDonatur>()
        };

        const string sql = @$"SELECT Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation, id_donatur
                                FROM Donatur
                                WHERE nama like '%' + @name + '%'";

        var rows = conn.Query<ResponseModeMasterDonatur>(sql, new { name });

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

    public ResponseData<List<ResponseModeMasterDonatur>> GetDataByTgl(string Tgl, IDbConnection conn)
    {
        ResponseData<List<ResponseModeMasterDonatur>> resp = new ResponseData<List<ResponseModeMasterDonatur>>()
        {
            data = new List<ResponseModeMasterDonatur>()
        };

        const string sql = @$"SELECT Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation, id_donatur
                                FROM Donatur
                                WHERE YEAR(TglLahir)=YEAR(@Tgl) ";

        //const string sql = @$"SELECT Nama, TglLahir, CreatedDate, NoHP, Status, LastDonation, id_donatur
        //                        FROM Donatur
        //                        WHERE TglLahir between DATEFROMPARTS(YEAR(@Tgl), 1, 1) And EOMonth(@Tgl)";

        var rows = conn.Query<ResponseModeMasterDonatur>(sql, new { Tgl });

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
}