using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Transaction
{
    public class RepoVoiceRecording
    {
    public void EnsureTable(IDbConnection conn, IDbTransaction? tran = null)
    {
        const string sql = @"
IF OBJECT_ID('dbo.VoiceRecordings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.VoiceRecordings
    (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Provider NVARCHAR(50) NOT NULL CONSTRAINT DF_VoiceRecordings_Provider DEFAULT ('LocalServer'),
        FileName NVARCHAR(255) NOT NULL,
        BucketName NVARCHAR(255) NOT NULL,
        ObjectName NVARCHAR(500) NOT NULL,
        StoragePath NVARCHAR(1000) NOT NULL CONSTRAINT DF_VoiceRecordings_StoragePath DEFAULT (''),
        FileUrl NVARCHAR(1000) NULL,
        ContentType NVARCHAR(100) NOT NULL,
        FileSize BIGINT NOT NULL,
        CreatedAt DATETIME NOT NULL CONSTRAINT DF_VoiceRecordings_CreatedAt DEFAULT (GETDATE())
    );
END;

IF COL_LENGTH('dbo.VoiceRecordings', 'Provider') IS NULL
BEGIN
    ALTER TABLE dbo.VoiceRecordings
    ADD Provider NVARCHAR(50) NOT NULL CONSTRAINT DF_VoiceRecordings_Provider_Alter DEFAULT ('LocalServer');
END;

IF COL_LENGTH('dbo.VoiceRecordings', 'StoragePath') IS NULL
BEGIN
    ALTER TABLE dbo.VoiceRecordings
    ADD StoragePath NVARCHAR(1000) NOT NULL CONSTRAINT DF_VoiceRecordings_StoragePath_Alter DEFAULT ('');
END;";

            conn.Execute(sql, transaction: tran);
        }

        public long Insert(
            ResponseModelVoiceRecording model,
            IDbConnection conn,
            IDbTransaction? tran = null)
        {
            EnsureTable(conn, tran);

            const string sql = @"
INSERT INTO dbo.VoiceRecordings
    (Provider, FileName, BucketName, ObjectName, StoragePath, FileUrl, ContentType, FileSize, CreatedAt)
VALUES
    (@provider, @fileName, @bucketName, @objectName, @storagePath, @fileUrl, @contentType, @fileSize, GETDATE());

SELECT CAST(SCOPE_IDENTITY() AS BIGINT);";

            return conn.ExecuteScalar<long>(sql, new
            {
                model.provider,
                model.fileName,
                model.bucketName,
                model.objectName,
                model.storagePath,
                model.fileUrl,
                model.contentType,
                model.fileSize
            }, transaction: tran);
        }

        public ResponseModelVoiceRecording? GetById(long id, IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTable(conn, tran);

            const string sql = @"
SELECT
    Id AS id,
    ISNULL(Provider, 'LocalServer') AS provider,
    ISNULL(FileName, '') AS fileName,
    ISNULL(BucketName, '') AS bucketName,
    ISNULL(ObjectName, '') AS objectName,
    ISNULL(StoragePath, '') AS storagePath,
    FileUrl AS fileUrl,
    ISNULL(ContentType, '') AS contentType,
    ISNULL(FileSize, 0) AS fileSize,
    CreatedAt AS createdAt
FROM dbo.VoiceRecordings
WHERE Id = @id";

            return conn.QuerySingleOrDefault<ResponseModelVoiceRecording>(sql, new { id }, transaction: tran);
        }
    }
}
