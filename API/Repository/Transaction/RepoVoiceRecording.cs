using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Transaction
{
    public class RepoVoiceRecording
    {
        public long Insert(
            ResponseModelVoiceRecording model,
            IDbConnection conn,
            IDbTransaction? tran = null)
        {
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
