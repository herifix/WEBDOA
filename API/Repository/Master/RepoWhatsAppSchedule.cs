using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Master
{
    public class RepoWhatsAppSchedule
    {
        public void EnsureTables(IDbConnection conn, IDbTransaction? tran = null)
        {
            const string sql = @"
IF OBJECT_ID('dbo.WhatsAppScheduleSetting', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WhatsAppScheduleSetting
    (
        id_setting BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SendTime TIME NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_SendTime DEFAULT ('08:00:00'),
        IsActive BIT NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_IsActive DEFAULT ((0)),
        CreatedDate DATETIME NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_CreatedDate DEFAULT (GETDATE()),
        UpdatedDate DATETIME NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_UpdatedDate DEFAULT (GETDATE())
    );

    INSERT INTO dbo.WhatsAppScheduleSetting (SendTime, IsActive)
    VALUES ('08:00:00', 0);
END;

IF OBJECT_ID('dbo.TRBirthdayPrayWASendLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TRBirthdayPrayWASendLog
    (
        id_sendlog BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_TRBirthdayPray BIGINT NOT NULL,
        BirthdayDate DATE NOT NULL,
        SentAt DATETIME NOT NULL CONSTRAINT DF_TRBirthdayPrayWASendLog_SentAt DEFAULT (GETDATE()),
        Success BIT NOT NULL,
        ResponseMessage NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBirthdayPrayWASendLog_ResponseMessage DEFAULT ('')
    );
END;";

            conn.Execute(sql, transaction: tran);
        }

        public ResponseModelWhatsAppSchedule GetSetting(IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTables(conn, tran);

            const string sql = @"
                SELECT TOP 1
                    id_setting,
                    CONVERT(varchar(5), SendTime, 108) AS sendTime,
                    ISNULL(IsActive, 0) AS isActive,
                    UpdatedDate
                FROM dbo.WhatsAppScheduleSetting
                ORDER BY id_setting";

            return conn.QuerySingle<ResponseModelWhatsAppSchedule>(sql, transaction: tran);
        }

        public void Upsert(RequestUpdateWhatsAppSchedule request, IDbConnection conn, IDbTransaction tran)
        {
            EnsureTables(conn, tran);

            const string sql = @"
                UPDATE dbo.WhatsAppScheduleSetting
                SET
                    SendTime = @sendTime,
                    IsActive = @isActive,
                    UpdatedDate = GETDATE();

                IF @@ROWCOUNT = 0
                BEGIN
                    INSERT INTO dbo.WhatsAppScheduleSetting (SendTime, IsActive)
                    VALUES (@sendTime, @isActive);
                END";

            conn.Execute(sql, new
            {
                sendTime = request.sendTime ?? "08:00",
                isActive = request.isActive
            }, tran);
        }

        public List<ResponseModelBirthdayPrayDispatchItem> GetDueDispatches(DateTime runAt, IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTables(conn, tran);

            const string sql = @"
DECLARE @sendTime TIME = (
    SELECT TOP 1 SendTime
    FROM dbo.WhatsAppScheduleSetting
    WHERE ISNULL(IsActive, 0) = 1
    ORDER BY id_setting
);

IF @sendTime IS NULL
BEGIN
    SELECT TOP 0
        CAST(0 AS BIGINT) AS id_TRBirthdayPray,
        CAST(0 AS BIGINT) AS id_pendoa,
        CAST('' AS varchar(255)) AS namaDonatur,
        CAST('' AS varchar(30)) AS noHPDonatur,
        CAST('' AS varchar(255)) AS namaPendoa,
        CAST('' AS varchar(30)) AS noHPPendoa,
        CAST(GETDATE() AS date) AS birthdayDate,
        CAST('' AS nvarchar(max)) AS pesan,
        CAST('' AS nvarchar(max)) AS pathPesanSuara;
    RETURN;
END;

SELECT
    t.id_TRBirthdayPray,
    ISNULL(t.id_pendoa, 0) AS id_pendoa,
    ISNULL(t.Nama, '') AS namaDonatur,
    ISNULL(d.NoHP, '') AS noHPDonatur,
    ISNULL(p.nama, '') AS namaPendoa,
    ISNULL(p.nohp, '') AS noHPPendoa,
    CAST(t.BirthdayDate AS date) AS birthdayDate,
    ISNULL(t.Pesan, '') AS pesan,
    ISNULL(t.PathPesanSuara, '') AS pathPesanSuara
FROM TRBirthdayPray t
LEFT JOIN Donatur d
    ON LTRIM(RTRIM(d.Nama)) = LTRIM(RTRIM(t.Nama))
LEFT JOIN Pendoa p
    ON p.id_pendoa = t.id_pendoa
WHERE CAST(t.BirthdayDate AS date) = CAST(@runAt AS date)
  AND CAST(@runAt AS time) >= @sendTime
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.TRBirthdayPrayWASendLog log
      WHERE log.id_TRBirthdayPray = t.id_TRBirthdayPray
        AND CAST(log.BirthdayDate AS date) = CAST(t.BirthdayDate AS date)
        AND ISNULL(log.Success, 0) = 1
  )
ORDER BY t.id_TRBirthdayPray";

            return conn.Query<ResponseModelBirthdayPrayDispatchItem>(sql, new { runAt }, tran).ToList();
        }

        public void InsertSendLog(
            long idTRBirthdayPray,
            DateTime birthdayDate,
            bool success,
            string responseMessage,
            IDbConnection conn,
            IDbTransaction? tran = null)
        {
            EnsureTables(conn, tran);

            const string sql = @"
                INSERT INTO dbo.TRBirthdayPrayWASendLog
                    (id_TRBirthdayPray, BirthdayDate, SentAt, Success, ResponseMessage)
                VALUES
                    (@idTRBirthdayPray, @birthdayDate, GETDATE(), @success, @responseMessage)";

            conn.Execute(sql, new
            {
                idTRBirthdayPray,
                birthdayDate = birthdayDate.Date,
                success,
                responseMessage = responseMessage ?? ""
            }, tran);
        }
    }
}
