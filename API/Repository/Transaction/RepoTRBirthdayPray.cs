using API.Repository.global;
using Dapper;
using System.Data;

internal interface iRepoTRBirthdayPray
{
    List<ResponseModelDashboardBirthday> GetUpcomingBirthdayDashboard(DateTime currentDate, IDbConnection conn);
    ResponseData<ResponseModelTRBirthdayPray> GetDataByDonaturId(long idDonatur, int targetYear, IDbConnection conn, IDbTransaction? tran = null);
    List<ResponseModelTRBirthdayPrayHistory> GetHistoryByDonaturId(long idDonatur, IDbConnection conn);
    ResponseModelMasterPendoa? GetDefaultPendoa(IDbConnection conn, IDbTransaction? tran = null);
    long GetNextId(IDbConnection conn, IDbTransaction tran);
    long Create(RequestSaveTRBirthdayPray bodyRequest, ResponseModeMasterDonatur donatur, ResponseModelMasterPendoa defaultPendoa, DateTime birthdayDate, string pathPesanSuara, IDbConnection conn, IDbTransaction tran);
    void Update(long idTRBirthdayPray, string pesan, string pathPesanSuara, IDbConnection conn, IDbTransaction tran);
}

public class RepoTRBirthdayPray : iRepoTRBirthdayPray
{
    public List<ResponseModelDashboardBirthday> GetUpcomingBirthdayDashboard(DateTime currentDate, IDbConnection conn)
    {
        const string sql = @"
WITH DonaturBirthday AS (
    SELECT
        d.id_donatur,
        d.Nama,
        d.TglLahir,
        d.NoHP,
        d.Status,
        d.LastDonation,
        CASE
            WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@currentDate), 2, 1))) < 29
                THEN EOMONTH(DATEFROMPARTS(YEAR(@currentDate), 2, 1))
            ELSE DATEFROMPARTS(YEAR(@currentDate), MONTH(d.TglLahir), DAY(d.TglLahir))
        END AS birthdayDate
    FROM Donatur d
)
SELECT
    b.id_donatur,
    b.Nama,
    b.TglLahir,
    b.birthdayDate,
    b.NoHP,
    b.Status,
    b.LastDonation,
    CAST(CASE WHEN pray.id_TRBirthdayPray IS NULL THEN 0 ELSE 1 END AS bit) AS sudahDidoakan,
    pray.id_TRBirthdayPray,
    pray.CreatedDate AS prayCreatedDate
FROM DonaturBirthday b
OUTER APPLY (
    SELECT TOP 1 t.id_TRBirthdayPray, t.CreatedDate
    FROM TRBirthdayPray t
    WHERE LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(b.Nama))
      AND CAST(t.BirthdayDate AS date) = CAST(b.birthdayDate AS date)
    ORDER BY t.CreatedDate DESC, t.id_TRBirthdayPray DESC
) pray
WHERE CAST(b.birthdayDate AS date) > CAST(@currentDate AS date)
ORDER BY MONTH(b.birthdayDate), DAY(b.birthdayDate), b.Nama;";

        return conn.Query<ResponseModelDashboardBirthday>(sql, new { currentDate }).ToList();
    }

    public ResponseData<ResponseModelTRBirthdayPray> GetDataByDonaturId(long idDonatur, int targetYear, IDbConnection conn, IDbTransaction? tran = null)
    {
        var response = new ResponseData<ResponseModelTRBirthdayPray>
        {
            data = new ResponseModelTRBirthdayPray()
        };

        const string sql = @"
WITH DonaturBirthday AS (
    SELECT
        d.id_donatur,
        d.Nama AS namaDonatur,
        d.TglLahir,
        d.NoHP AS noHPDonatur,
        CASE
            WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(@targetYear, 2, 1))) < 29
                THEN EOMONTH(DATEFROMPARTS(@targetYear, 2, 1))
            ELSE DATEFROMPARTS(@targetYear, MONTH(d.TglLahir), DAY(d.TglLahir))
        END AS birthdayDate
    FROM Donatur d
    WHERE d.id_donatur = @idDonatur
)
SELECT
    ISNULL(t.id_TRBirthdayPray, 0) AS id_TRBirthdayPray,
    d.id_donatur,
    ISNULL(t.id_pendoa, ISNULL(p.id_pendoa, 0)) AS id_pendoa,
    d.namaDonatur,
    d.TglLahir,
    d.birthdayDate,
    d.noHPDonatur,
    ISNULL(p.nama, '') AS namaPendoa,
    ISNULL(p.nohp, '') AS noHPPendoa,
    ISNULL(t.Pesan, '') AS pesan,
    ISNULL(t.PathPesanSuara, '') AS pathPesanSuara,
    t.CreatedDate
FROM DonaturBirthday d
OUTER APPLY (
    SELECT TOP 1 *
    FROM TRBirthdayPray t
    WHERE LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(d.namaDonatur))
      AND CAST(t.BirthdayDate AS date) = CAST(d.birthdayDate AS date)
    ORDER BY t.CreatedDate DESC, t.id_TRBirthdayPray DESC
) t
LEFT JOIN Pendoa p
    ON p.id_pendoa = ISNULL(t.id_pendoa, (
        SELECT TOP 1 id_pendoa FROM Pendoa WHERE dfl = 1 ORDER BY id_pendoa
    ));";

        var row = conn.QuerySingleOrDefault<ResponseModelTRBirthdayPray>(
            sql,
            new { idDonatur, targetYear },
            tran
        );

        if (row != null && row.id_donatur > 0)
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

    public List<ResponseModelTRBirthdayPrayHistory> GetHistoryByDonaturId(long idDonatur, IDbConnection conn)
    {
        const string sql = @"
            SELECT
                t.id_TRBirthdayPray,
                t.id_pendoa,
                t.Nama AS namaDonatur,
                ISNULL(p.nama, '') AS namaPendoa,
                t.BirthdayDate AS birthdayDate,
                ISNULL(t.Pesan, '') AS pesan,
                ISNULL(t.PathPesanSuara, '') AS pathPesanSuara,
                t.CreatedDate
            FROM TRBirthdayPray t
            INNER JOIN Donatur d
                ON LTRIM(RTRIM(d.Nama)) = LTRIM(RTRIM(t.Nama))
            LEFT JOIN Pendoa p
                ON p.id_pendoa = t.id_pendoa
            WHERE d.id_donatur = @idDonatur
            ORDER BY t.BirthdayDate DESC, t.CreatedDate DESC, t.id_TRBirthdayPray DESC";

        return conn.Query<ResponseModelTRBirthdayPrayHistory>(sql, new { idDonatur }).ToList();
    }

    public ResponseModelMasterPendoa? GetDefaultPendoa(IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            SELECT TOP 1 id_pendoa, nama, nohp, dfl, createddate
            FROM Pendoa
            WHERE dfl = 1
            ORDER BY id_pendoa";

        return conn.QuerySingleOrDefault<ResponseModelMasterPendoa>(sql, transaction: tran);
    }

    public long GetNextId(IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"SELECT ISNULL(MAX(id_TRBirthdayPray), 0) + 1 FROM TRBirthdayPray";
        return conn.ExecuteScalar<long>(sql, transaction: tran);
    }

    public long Create(
        RequestSaveTRBirthdayPray bodyRequest,
        ResponseModeMasterDonatur donatur,
        ResponseModelMasterPendoa defaultPendoa,
        DateTime birthdayDate,
        string pathPesanSuara,
        IDbConnection conn,
        IDbTransaction tran)
    {
        long newId = GetNextId(conn, tran);

        const string sql = @"
            INSERT INTO TRBirthdayPray
                (id_TRBirthdayPray, id_pendoa, Nama, BirthdayDate, Pesan, PathPesanSuara, CreatedDate)
            VALUES
                (@id_TRBirthdayPray, @id_pendoa, @Nama, @BirthdayDate, @Pesan, @PathPesanSuara, GETDATE())";

        conn.Execute(sql, new
        {
            id_TRBirthdayPray = newId,
            id_pendoa = defaultPendoa.id_pendoa,
            Nama = donatur.Nama,
            BirthdayDate = birthdayDate,
            Pesan = bodyRequest.pesan ?? "",
            PathPesanSuara = pathPesanSuara ?? ""
        }, tran);

        return newId;
    }

    public void Update(long idTRBirthdayPray, string pesan, string pathPesanSuara, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            UPDATE TRBirthdayPray
            SET
                Pesan = @pesan,
                PathPesanSuara = @pathPesanSuara
            WHERE id_TRBirthdayPray = @idTRBirthdayPray";

        conn.Execute(sql, new
        {
            idTRBirthdayPray,
            pesan,
            pathPesanSuara
        }, tran);
    }
}
