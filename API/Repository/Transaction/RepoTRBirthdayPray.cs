using API.Repository.global;
using Dapper;
using System.Data;

internal interface iRepoTRBirthdayPray
{
    List<ResponseModelDashboardBirthday> GetUpcomingBirthdayDashboard(DateTime anchorDate, DateTime beginDate, IDbConnection conn);
    List<ResponseModelDashboardBirthday> GetUpcomingBirthdayByDate(DateTime targetDate, IDbConnection conn);
    List<ResponseModelTRBirthdayPrayDateStatus> GetDateStatuses( IDbConnection conn);
    ResponseData<ResponseModelTRBirthdayPray> GetDataByDonaturId(long idDonatur, int targetYear, IDbConnection conn, IDbTransaction? tran = null);
    ResponseModelTRBirthdayPray? GetNextTodayCompleteUnsent(DateTime currentDate, IDbConnection conn, IDbTransaction? tran = null);
    List<ResponseModelTRBirthdayPrayHistory> GetHistoryByDonaturId(long idDonatur, IDbConnection conn);
    List<ResponseModeMasterDonatur> GetDonatursByBirthdayDate(DateTime birthdayDate, IDbConnection conn, IDbTransaction? tran = null);
    ResponseModelMasterPendoa? GetDefaultPendoa(IDbConnection conn, IDbTransaction? tran = null);
    long GetNextId(IDbConnection conn, IDbTransaction tran);
    long Create(RequestSaveTRBirthdayPray bodyRequest, ResponseModeMasterDonatur donatur, ResponseModelMasterPendoa defaultPendoa, DateTime birthdayDate, string pathPesanSuara, IDbConnection conn, IDbTransaction tran);
    void Update(long idTRBirthdayPray, string pesan, string pathPesanSuara, IDbConnection conn, IDbTransaction tran);
    void UpdateVoicePath(long idTRBirthdayPray, string pathPesanSuara, IDbConnection conn, IDbTransaction tran);
    void MarkWASent(long idTRBirthdayPray, IDbConnection conn, IDbTransaction? tran = null);
    bool TryMarkWASentFromUnsent(long idTRBirthdayPray, IDbConnection conn, IDbTransaction? tran = null);
    void UpsertWhatsAppDeliveryReceipt(WhatsAppDeliveryReceipt receipt, IDbConnection conn);
    WhatsAppDeliveryReceipt? GetLatestWhatsAppDeliveryReceipt(string phoneNumber, DateTime? sentAt, IDbConnection conn);
}

public class RepoTRBirthdayPray : iRepoTRBirthdayPray
{
    public List<ResponseModelDashboardBirthday> GetUpcomingBirthdayDashboard(DateTime anchorDate, DateTime beginDate, IDbConnection conn)
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
            WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@beginDate), 2, 1))) < 29
                THEN EOMONTH(DATEFROMPARTS(YEAR(@beginDate), 2, 1))
            ELSE DATEFROMPARTS(YEAR(@beginDate), MONTH(d.TglLahir), DAY(d.TglLahir))
        END AS birthdayDateThisYear
    FROM Donatur d
),
UpcomingBirthday AS (
    SELECT
        b.id_donatur,
        b.Nama,
        b.TglLahir,
        b.NoHP,
        b.Status,
        b.LastDonation,
        CASE
            WHEN CAST(b.birthdayDateThisYear AS date) >= CAST(@beginDate AS date) THEN CAST(b.birthdayDateThisYear AS date)
            ELSE CAST(CASE
                WHEN MONTH(b.TglLahir) = 2 AND DAY(b.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@beginDate) + 1, 2, 1))) < 29
                    THEN EOMONTH(DATEFROMPARTS(YEAR(@beginDate) + 1, 2, 1))
                ELSE DATEFROMPARTS(YEAR(@beginDate) + 1, MONTH(b.TglLahir), DAY(b.TglLahir))
            END AS date)
        END AS birthdayDate
    FROM DonaturBirthday b
)
SELECT
    b.id_donatur,
    b.Nama,
    b.TglLahir,
    b.birthdayDate,
    b.NoHP,
    b.Status,
    b.LastDonation,
    CAST(
        CASE
            WHEN pray.id_TRBirthdayPray IS NULL THEN 0
            WHEN LTRIM(RTRIM(ISNULL(pray.Pesan, ''))) = '' THEN 0
            WHEN LTRIM(RTRIM(ISNULL(pray.PathPesanSuara, ''))) = '' THEN 0
            ELSE 1
        END AS bit
    ) AS sudahDidoakan,
    CAST(
        CASE
            WHEN pray.id_TRBirthdayPray IS NULL THEN 0
            WHEN LTRIM(RTRIM(ISNULL(pray.Pesan, ''))) = '' THEN 0
            ELSE 1
        END AS bit
    ) AS sudahAdaPesanDoa,
    CAST(
        CASE
            WHEN pray.id_TRBirthdayPray IS NULL THEN 0
            WHEN LTRIM(RTRIM(ISNULL(pray.PathPesanSuara, ''))) = '' THEN 0
            ELSE 1
        END AS bit
    ) AS sudahAdaPesanSuara,
    pray.id_TRBirthdayPray,
    pray.CreatedDate AS prayCreatedDate,
    ISNULL(pray.IsWASent, 0) AS isWASent,
    pray.WASentDate AS waSentDate
FROM UpcomingBirthday b
OUTER APPLY (
    SELECT TOP 1 t.id_TRBirthdayPray, t.CreatedDate, t.Pesan, t.PathPesanSuara, t.IsWASent, t.WASentDate
    FROM TRBirthdayPray t
    WHERE LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(b.Nama))
      AND CAST(t.BirthdayDate AS date) = CAST(b.birthdayDate AS date)
    ORDER BY t.CreatedDate DESC, t.id_TRBirthdayPray DESC
) pray
WHERE CAST(b.birthdayDate AS date) >= CAST(@beginDate AS date)
  AND CAST(b.birthdayDate AS date) <= CAST(DATEADD(MONTH, 6, @anchorDate) AS date)
ORDER BY b.birthdayDate, b.Nama;";

        return conn.Query<ResponseModelDashboardBirthday>(sql, new { anchorDate, beginDate }).ToList();
    }

    public List<ResponseModelDashboardBirthday> GetUpcomingBirthdayByDate(DateTime targetDate, IDbConnection conn)
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
                    WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@targetDate), 2, 1))) < 29
                        THEN EOMONTH(DATEFROMPARTS(YEAR(@targetDate), 2, 1))
                    ELSE DATEFROMPARTS(YEAR(@targetDate), MONTH(d.TglLahir), DAY(d.TglLahir))
                END AS birthdayDate
            FROM Donatur d
            WHERE d.TglLahir IS NOT NULL
        )
        SELECT
            b.id_donatur,
            b.Nama,
            b.TglLahir,
            b.birthdayDate,
            b.NoHP,
            b.Status,
            b.LastDonation,
            CAST(
                CASE
                    WHEN pray.id_TRBirthdayPray IS NULL THEN 0
                    WHEN LTRIM(RTRIM(ISNULL(pray.Pesan, ''))) = '' THEN 0
                    WHEN LTRIM(RTRIM(ISNULL(pray.PathPesanSuara, ''))) = '' THEN 0
                    ELSE 1
                END AS bit
            ) AS sudahDidoakan,
            CAST(
                CASE
                    WHEN pray.id_TRBirthdayPray IS NULL THEN 0
                    WHEN LTRIM(RTRIM(ISNULL(pray.Pesan, ''))) = '' THEN 0
                    ELSE 1
                END AS bit
            ) AS sudahAdaPesanDoa,
            CAST(
                CASE
                    WHEN pray.id_TRBirthdayPray IS NULL THEN 0
                    WHEN LTRIM(RTRIM(ISNULL(pray.PathPesanSuara, ''))) = '' THEN 0
                    ELSE 1
                END AS bit
            ) AS sudahAdaPesanSuara,
            isnull(pray.id_TRBirthdayPray,0) id_TRBirthdayPray,
            pray.CreatedDate AS prayCreatedDate,
            ISNULL(pray.IsWASent, 0) AS isWASent,
            pray.WASentDate AS waSentDate
        FROM DonaturBirthday b
        OUTER APPLY (
            SELECT TOP 1 t.id_TRBirthdayPray, t.CreatedDate, t.Pesan, t.PathPesanSuara, t.IsWASent, t.WASentDate
            FROM TRBirthdayPray t
            WHERE LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(b.Nama))
              AND CAST(t.BirthdayDate AS date) = CAST(b.birthdayDate AS date)
            ORDER BY t.CreatedDate DESC, t.id_TRBirthdayPray DESC
        ) pray
        WHERE CAST(b.birthdayDate AS date) = CAST(@targetDate AS date)
        ORDER BY b.Nama;";

        return conn.Query<ResponseModelDashboardBirthday>(sql, new { targetDate }).ToList();
    }

    public List<ResponseModelTRBirthdayPrayDateStatus> GetDateStatuses( IDbConnection conn)
    {
        const string sql = @"
        Declare @currentDate as DateTime = GetDate(); 

        DECLARE @startDate date = CAST(DATEADD(DAY, 1, @currentDate) AS date);
        DECLARE @endDate date = CAST(DATEADD(MONTH, 12, @currentDate) AS date);

        ;WITH CalendarDates AS (
            SELECT @startDate AS targetDate
            UNION ALL
            SELECT DATEADD(DAY, 1, targetDate)
            FROM CalendarDates
            WHERE targetDate < @endDate
        ),
        DonaturBirthday AS (
            SELECT
                d.id_donatur,
                d.Nama,
                CASE
                    WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@startDate), 2, 1))) < 29
                        THEN EOMONTH(DATEFROMPARTS(YEAR(@startDate), 2, 1))
                    ELSE DATEFROMPARTS(YEAR(@startDate), MONTH(d.TglLahir), DAY(d.TglLahir))
                END AS birthdayDateThisYear
            FROM Donatur d
            WHERE d.TglLahir IS NOT NULL
        ),
        UpcomingBirthday AS (
            SELECT
                b.id_donatur,
                b.Nama,
                CASE
                    WHEN CAST(b.birthdayDateThisYear AS date) >= @startDate THEN CAST(b.birthdayDateThisYear AS date)
                    ELSE CAST(CASE
                        WHEN MONTH((SELECT TglLahir FROM Donatur WHERE id_donatur = b.id_donatur)) = 2
                             AND DAY((SELECT TglLahir FROM Donatur WHERE id_donatur = b.id_donatur)) = 29
                             AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@startDate) + 1, 2, 1))) < 29
                            THEN EOMONTH(DATEFROMPARTS(YEAR(@startDate) + 1, 2, 1))
                        ELSE DATEFROMPARTS(
                            YEAR(@startDate) + 1,
                            MONTH((SELECT TglLahir FROM Donatur WHERE id_donatur = b.id_donatur)),
                            DAY((SELECT TglLahir FROM Donatur WHERE id_donatur = b.id_donatur))
                        )
                    END AS date)
                END AS birthdayDate
            FROM DonaturBirthday b
        ),
        BirthdayStatus AS (
            SELECT
                CAST(b.birthdayDate AS date) AS birthdayDate,
                COUNT(1) AS donorCount,
                SUM(
                    CASE
                        WHEN pray.id_TRBirthdayPray IS NOT NULL
                         AND LTRIM(RTRIM(ISNULL(pray.Pesan, ''))) <> ''
                         AND LTRIM(RTRIM(ISNULL(pray.PathPesanSuara, ''))) <> ''
                            THEN 1
                        ELSE 0
                    END
                ) AS prayedCount
            FROM UpcomingBirthday b
            OUTER APPLY (
                SELECT TOP 1 t.id_TRBirthdayPray, t.Pesan, t.PathPesanSuara
                FROM TRBirthdayPray t
                WHERE LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(b.Nama))
                  AND CAST(t.BirthdayDate AS date) = CAST(b.birthdayDate AS date)
                ORDER BY t.CreatedDate DESC, t.id_TRBirthdayPray DESC
            ) pray
            WHERE CAST(b.birthdayDate AS date) >= @startDate
              AND CAST(b.birthdayDate AS date) <= @endDate
            GROUP BY CAST(b.birthdayDate AS date)
        )
        SELECT
            CONVERT(varchar(10), c.targetDate, 23) AS [date],
            CAST(
                CASE
                    WHEN ISNULL(s.donorCount, 0) > 0 AND ISNULL(s.prayedCount, 0) = ISNULL(s.donorCount, 0)
                        THEN 1
                    ELSE 0
                END AS bit
            ) AS isAllPrayed,
            CAST(CASE WHEN ISNULL(s.donorCount, 0) > 0 THEN 1 ELSE 0 END AS bit) AS hasDonors
        FROM CalendarDates c
        LEFT JOIN BirthdayStatus s ON s.birthdayDate = c.targetDate
        ORDER BY c.targetDate
        OPTION (MAXRECURSION 1000);";

        return conn.Query<ResponseModelTRBirthdayPrayDateStatus>(sql).ToList();
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
    t.CreatedDate,
    ISNULL(t.IsWASent, 0) AS isWASent,
    t.WASentDate AS waSentDate
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

    public ResponseModelTRBirthdayPray? GetNextTodayCompleteUnsent(DateTime currentDate, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
WITH DonaturBirthday AS (
    SELECT
        d.id_donatur,
        d.Nama AS namaDonatur,
        d.TglLahir,
        d.NoHP AS noHPDonatur,
        CASE
            WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@currentDate), 2, 1))) < 29
                THEN EOMONTH(DATEFROMPARTS(YEAR(@currentDate), 2, 1))
            ELSE DATEFROMPARTS(YEAR(@currentDate), MONTH(d.TglLahir), DAY(d.TglLahir))
        END AS birthdayDate
    FROM Donatur d
    WHERE d.TglLahir IS NOT NULL
)
SELECT TOP 1
    pray.id_TRBirthdayPray,
    d.id_donatur,
    ISNULL(pray.id_pendoa, ISNULL(p.id_pendoa, 0)) AS id_pendoa,
    d.namaDonatur,
    d.TglLahir,
    d.birthdayDate,
    d.noHPDonatur,
    ISNULL(p.nama, '') AS namaPendoa,
    ISNULL(p.nohp, '') AS noHPPendoa,
    ISNULL(pray.Pesan, '') AS pesan,
    ISNULL(pray.PathPesanSuara, '') AS pathPesanSuara,
    pray.CreatedDate,
    ISNULL(pray.IsWASent, 0) AS isWASent,
    pray.WASentDate AS waSentDate
FROM DonaturBirthday d
OUTER APPLY (
    SELECT TOP 1 *
    FROM TRBirthdayPray t
    WHERE LTRIM(RTRIM(t.Nama)) = LTRIM(RTRIM(d.namaDonatur))
      AND CAST(t.BirthdayDate AS date) = CAST(d.birthdayDate AS date)
    ORDER BY t.CreatedDate DESC, t.id_TRBirthdayPray DESC
) pray
LEFT JOIN Pendoa p
    ON p.id_pendoa = ISNULL(pray.id_pendoa, (
        SELECT TOP 1 id_pendoa FROM Pendoa WHERE dfl = 1 ORDER BY id_pendoa
    ))
WHERE CAST(d.birthdayDate AS date) = CAST(@currentDate AS date)
  AND pray.id_TRBirthdayPray IS NOT NULL
  AND LTRIM(RTRIM(ISNULL(pray.Pesan, ''))) <> ''
  AND LTRIM(RTRIM(ISNULL(pray.PathPesanSuara, ''))) <> ''
  AND ISNULL(pray.IsWASent, 0) = 0
ORDER BY d.namaDonatur, d.id_donatur;";

        return conn.QuerySingleOrDefault<ResponseModelTRBirthdayPray>(sql, new { currentDate }, tran);
    }

    public List<ResponseModeMasterDonatur> GetDonatursByBirthdayDate(DateTime birthdayDate, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            SELECT
                d.id_donatur,
                d.Nama,
                d.TglLahir,
                d.CreatedDate,
                d.NoHP,
                d.Status,
                d.LastDonation
            FROM Donatur d
            WHERE
                CAST(
                    CASE
                        WHEN MONTH(d.TglLahir) = 2 AND DAY(d.TglLahir) = 29 AND DAY(EOMONTH(DATEFROMPARTS(YEAR(@birthdayDate), 2, 1))) < 29
                            THEN EOMONTH(DATEFROMPARTS(YEAR(@birthdayDate), 2, 1))
                        ELSE DATEFROMPARTS(YEAR(@birthdayDate), MONTH(d.TglLahir), DAY(d.TglLahir))
                    END AS date
                ) = CAST(@birthdayDate AS date)
            ORDER BY d.Nama";

        return conn.Query<ResponseModeMasterDonatur>(sql, new { birthdayDate }, tran).ToList();
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

    public void UpdateVoicePath(long idTRBirthdayPray, string pathPesanSuara, IDbConnection conn, IDbTransaction tran)
    {
        const string sql = @"
            UPDATE TRBirthdayPray
            SET PathPesanSuara = @pathPesanSuara
            WHERE id_TRBirthdayPray = @idTRBirthdayPray";

        conn.Execute(sql, new
        {
            idTRBirthdayPray,
            pathPesanSuara
        }, tran);
    }

    public void MarkWASent(long idTRBirthdayPray, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            UPDATE TRBirthdayPray
            SET 
                IsWASent = 1,
                WASentDate = GETDATE()
            WHERE id_TRBirthdayPray = @idTRBirthdayPray";

        conn.Execute(sql, new { idTRBirthdayPray }, transaction: tran);
    }

    public bool TryMarkWASentFromUnsent(long idTRBirthdayPray, IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
            UPDATE TRBirthdayPray
            SET
                IsWASent = 1,
                WASentDate = GETDATE()
            WHERE id_TRBirthdayPray = @idTRBirthdayPray
              AND ISNULL(IsWASent, 0) = 0";

        return conn.Execute(sql, new { idTRBirthdayPray }, transaction: tran) == 1;
    }

    public void UpsertWhatsAppDeliveryReceipt(WhatsAppDeliveryReceipt receipt, IDbConnection conn)
    {
        const string sql = @"
MERGE dbo.TRBirthdayPrayWADeliveryReceipt WITH (HOLDLOCK) AS target
USING (SELECT @gatewayMessageId AS GatewayMessageId) AS source
ON target.GatewayMessageId = source.GatewayMessageId
WHEN MATCHED THEN
    UPDATE SET
        DeliveryStatus = CASE
            WHEN target.DeliveryStatus = 'READ' THEN target.DeliveryStatus
            WHEN @status = 'READ' THEN @status
            WHEN @occurredAt >= target.OccurredAt THEN @status
            ELSE target.DeliveryStatus
        END,
        RecipientPhoneNumber = CASE
            WHEN @recipientPhoneNumber <> '' THEN @recipientPhoneNumber
            ELSE target.RecipientPhoneNumber
        END,
        OccurredAt = CASE WHEN @occurredAt >= target.OccurredAt THEN @occurredAt ELSE target.OccurredAt END,
        ReceivedAt = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (GatewayMessageId, DeliveryStatus, RecipientPhoneNumber, OccurredAt, ReceivedAt)
    VALUES (@gatewayMessageId, @status, @recipientPhoneNumber, @occurredAt, GETDATE());";

        conn.Execute(sql, new
        {
            receipt.gatewayMessageId,
            receipt.status,
            receipt.recipientPhoneNumber,
            occurredAt = receipt.occurredAt?.UtcDateTime ?? DateTime.UtcNow
        });
    }

    public WhatsAppDeliveryReceipt? GetLatestWhatsAppDeliveryReceipt(
        string phoneNumber,
        DateTime? sentAt,
        IDbConnection conn)
    {
        const string sql = @"
SELECT TOP 1
    GatewayMessageId AS gatewayMessageId,
    DeliveryStatus AS status,
    RecipientPhoneNumber AS recipientPhoneNumber,
    OccurredAt AS occurredAt
FROM dbo.TRBirthdayPrayWADeliveryReceipt
WHERE RecipientPhoneNumber = @phoneNumber
  AND DeliveryStatus IN ('DELIVERED', 'READ', 'FAILED')
  AND (@sentAt IS NULL OR OccurredAt >= DATEADD(MINUTE, -2, @sentAt))
ORDER BY
    CASE DeliveryStatus
        WHEN 'READ' THEN 4
        WHEN 'DELIVERED' THEN 3
        WHEN 'FAILED' THEN 2
        ELSE 1
    END DESC,
    OccurredAt DESC;";

        return conn.QuerySingleOrDefault<WhatsAppDeliveryReceipt>(sql, new { phoneNumber, sentAt });
    }
}
