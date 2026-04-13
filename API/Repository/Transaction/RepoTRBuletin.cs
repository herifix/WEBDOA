using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Transaction
{
    public class RepoTRBuletin
    {
        public void EnsureTable(IDbConnection conn, IDbTransaction? tran = null)
        {
            const string sql = @"
IF OBJECT_ID('dbo.TRBuletin', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TRBuletin
    (
        id_TRBuletin BIGINT NOT NULL PRIMARY KEY,
        [Description] VARCHAR(100) NOT NULL,
        PesanText NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_Pesan DEFAULT (''),
        PathFile NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_PathFile DEFAULT (''),
        CreatedDate DATETIME NOT NULL CONSTRAINT DF_TRBuletin_CreatedDate DEFAULT (GETDATE())
    );
END;

IF COL_LENGTH('dbo.TRBuletin', 'PesanText') IS NULL
BEGIN
    ALTER TABLE dbo.TRBuletin
    ADD PesanText NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_Pesan_Alter DEFAULT ('');
END;

IF COL_LENGTH('dbo.TRBuletin', 'PathFile') IS NULL
BEGIN
    ALTER TABLE dbo.TRBuletin
    ADD PathFile NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_PathFile_Alter DEFAULT ('');
END;

IF COL_LENGTH('dbo.TRBuletin', 'CreatedDate') IS NULL
BEGIN
    ALTER TABLE dbo.TRBuletin
    ADD CreatedDate DATETIME NOT NULL CONSTRAINT DF_TRBuletin_CreatedDate_Alter DEFAULT (GETDATE());
END;";

            conn.Execute(sql, transaction: tran);
        }

        public List<ResponseModelTRBuletin> GetDataAll(IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTable(conn, tran);

            const string sql = @"
SELECT
    t.id_TRBuletin AS id_buletin,
    ISNULL(t.[Description], '') AS [description],
    ISNULL(t.PesanText, '') AS pesanText,
    ISNULL(t.PathFile, '') AS pathFile,
    t.CreatedDate AS createdDate,
    ISNULL(p.nama, '') AS defaultPendoaName
FROM dbo.TRBuletin t
OUTER APPLY (
    SELECT TOP 1 nama
    FROM dbo.Pendoa
    WHERE dfl = 1
    ORDER BY id_pendoa
) p
ORDER BY t.CreatedDate DESC, t.id_TRBuletin DESC;";

            return conn.Query<ResponseModelTRBuletin>(sql, transaction: tran).ToList();
        }

        public ResponseModelTRBuletin GetDataById(long idTRBuletin, IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTable(conn, tran);

            const string sql = @"
SELECT TOP 1
    t.id_TRBuletin AS id_buletin,
    ISNULL(t.[Description], '') AS [description],
    ISNULL(t.PesanText, '') AS pesanText,
    ISNULL(t.PathFile, '') AS pathFile,
    t.CreatedDate AS createdDate,
    ISNULL(p.nama, '') AS defaultPendoaName
FROM dbo.TRBuletin t
OUTER APPLY (
    SELECT TOP 1 nama
    FROM dbo.Pendoa
    WHERE dfl = 1
    ORDER BY id_pendoa
) p
WHERE t.id_TRBuletin = @idTRBuletin;";

            return conn.QuerySingleOrDefault<ResponseModelTRBuletin>(
                sql,
                new { idTRBuletin },
                tran
            ) ?? new ResponseModelTRBuletin();
        }

        public string GetDefaultPendoaName(IDbConnection conn, IDbTransaction? tran = null)
        {
            const string sql = @"
SELECT TOP 1 ISNULL(nama, '')
FROM dbo.Pendoa
WHERE dfl = 1
ORDER BY id_pendoa;";

            return conn.ExecuteScalar<string?>(sql, transaction: tran) ?? "";
        }

        public long GetNextId(IDbConnection conn, IDbTransaction tran)
        {
            EnsureTable(conn, tran);

            const string sql = @"SELECT ISNULL(MAX(id_TRBuletin), 0) + 1 FROM dbo.TRBuletin;";
            return conn.ExecuteScalar<long>(sql, transaction: tran);
        }

        public long Create(
            string description,
            string pesanText,
            string pathFile,
            IDbConnection conn,
            IDbTransaction tran)
        {
            long newId = GetNextId(conn, tran);

            const string sql = @"
INSERT INTO dbo.TRBuletin
    (id_TRBuletin, [Description], PesanText, PathFile, CreatedDate)
VALUES
    (@id_TRBuletin, @description, @pesanText, @pathFile, GETDATE());";

            conn.Execute(sql, new
            {
                id_TRBuletin = newId,
                description,
                pesanText,
                pathFile
            }, tran);

            return newId;
        }

        public void Update(
            long idTRBuletin,
            string description,
            string pesanText,
            string pathFile,
            IDbConnection conn,
            IDbTransaction tran)
        {
            const string sql = @"
UPDATE dbo.TRBuletin
SET
    [Description] = @description,
    PesanText = @pesanText,
    PathFile = @pathFile
WHERE id_TRBuletin = @idTRBuletin;";

            conn.Execute(sql, new
            {
                idTRBuletin,
                description,
                pesanText,
                pathFile
            }, tran);
        }

        public void Delete(long idTRBuletin, IDbConnection conn, IDbTransaction tran)
        {
            const string sql = @"DELETE FROM dbo.TRBuletin WHERE id_TRBuletin = @idTRBuletin;";
            conn.Execute(sql, new { idTRBuletin }, tran);
        }
    }
}
