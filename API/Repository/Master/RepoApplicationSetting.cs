using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Master
{
    public class RepoApplicationSetting
    {
        public void EnsureTable(IDbConnection conn, IDbTransaction? tran = null)
        {
            const string sql = @"
IF OBJECT_ID('dbo.MsProg', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MsProg
    (
        MsgTemplate NVARCHAR(MAX) NOT NULL CONSTRAINT DF_MsProg_MsgTemplate DEFAULT (''),
        MsgLink NVARCHAR(255) NOT NULL CONSTRAINT DF_MsProg_MsgLink DEFAULT (''),
        MsgImage NVARCHAR(255) NOT NULL CONSTRAINT DF_MsProg_MsgImage DEFAULT (''),
        MsgWA_TemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_TemplateName DEFAULT (''),
        StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType DEFAULT ('LocalServer')
    );

    INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, StorageType)
    VALUES ('', '', '', 'LocalServer');
END;

IF COL_LENGTH('dbo.MsProg', 'MsgWA_TemplateName') IS NULL
BEGIN
    ALTER TABLE dbo.MsProg
    ADD MsgWA_TemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_TemplateName_Alter DEFAULT ('');
END;

IF COL_LENGTH('dbo.MsProg', 'StorageType') IS NULL
BEGIN
    ALTER TABLE dbo.MsProg
    ADD StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType_Alter DEFAULT ('LocalServer');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.MsProg)
BEGIN
    INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, StorageType)
    VALUES ('', '', '', 'LocalServer');
END;";

            conn.Execute(sql, transaction: tran);
        }

        public ResponseModelApplicationSetting GetSetting(IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTable(conn, tran);

            const string sql = @"
            SELECT TOP 1
                ISNULL(MsgTemplate, '') AS msgTemplate,
                ISNULL(MsgLink, '') AS msgLink,
                ISNULL(MsgImage, '') AS msgImage,
                ISNULL(MsgWA_TemplateName, '') AS whatsappTemplateName,
                ISNULL(StorageType, 'LocalServer') AS storageType
            FROM dbo.MsProg";

            return conn.QueryFirstOrDefault<ResponseModelApplicationSetting>(sql, transaction: tran) 
                   ?? new ResponseModelApplicationSetting();
        }

        public void Upsert(RequestUpdateApplicationSetting request, IDbConnection conn, IDbTransaction tran)
        {
            EnsureTable(conn, tran);

            const string sql = @"
UPDATE dbo.MsProg
SET
    MsgTemplate = @MsgTemplate,
    MsgLink = @MsgLink,
    MsgImage = @MsgImage,
    MsgWA_TemplateName = @MsgWA_TemplateName,
    StorageType = @StorageType;

IF @@ROWCOUNT = 0
BEGIN
    INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, MsgWA_TemplateName, StorageType)
    VALUES (@MsgTemplate, @MsgLink, @MsgImage, @MsgWA_TemplateName, @StorageType);
END";

            conn.Execute(sql, new
            {
                MsgTemplate = request.msgTemplate ?? "",
                MsgLink = request.msgLink ?? "",
                MsgImage = request.existingMsgImage ?? "",
                MsgWA_TemplateName = request.whatsappTemplateName ?? "",
                StorageType = NormalizeStorageType(request.storageType)
            }, tran);
        }

        private string NormalizeStorageType(string? storageType)
        {
            return string.Equals(storageType, "GoogleCloud", StringComparison.OrdinalIgnoreCase)
                ? "GoogleCloud"
                : "LocalServer";
        }
    }
}
