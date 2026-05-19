using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Master
{
    public class RepoApplicationSetting
    {
        public void EnsureTable(IDbConnection conn, IDbTransaction? tran = null)
        {
            if (!TableExists(conn, tran))
            {
                try
                {
                    const string createSql = @"
CREATE TABLE dbo.MsProg
(
    MsgTemplate NVARCHAR(MAX) NOT NULL CONSTRAINT DF_MsProg_MsgTemplate DEFAULT (''),
    MsgLink NVARCHAR(255) NOT NULL CONSTRAINT DF_MsProg_MsgLink DEFAULT (''),
    MsgImage NVARCHAR(255) NOT NULL CONSTRAINT DF_MsProg_MsgImage DEFAULT (''),
    MsgWA_TemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_TemplateName DEFAULT (''),
    MsgWA_Token NVARCHAR(500) NOT NULL CONSTRAINT DF_MsProg_MsgWA_Token DEFAULT (''),
    StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType DEFAULT ('LocalServer')
);";
                    conn.Execute(createSql, transaction: tran);
                }
                catch
                {
                    if (!TableExists(conn, tran))
                    {
                        throw;
                    }
                }
            }

            TryEnsureColumn(conn, tran, "MsgWA_TemplateName", "ALTER TABLE dbo.MsProg ADD MsgWA_TemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_TemplateName_Alter DEFAULT ('')");
            TryEnsureColumn(conn, tran, "StorageType", "ALTER TABLE dbo.MsProg ADD StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType_Alter DEFAULT ('LocalServer')");
            TryEnsureColumn(conn, tran, "MsgWA_Token", "ALTER TABLE dbo.MsProg ADD MsgWA_Token NVARCHAR(500) NOT NULL CONSTRAINT DF_MsProg_MsgWA_Token_Alter DEFAULT ('')");

            if (!HasAnyRow(conn, tran))
            {
                if (ColumnExists(conn, tran, "MsgWA_Token") && ColumnExists(conn, tran, "MsgWA_TemplateName") && ColumnExists(conn, tran, "StorageType"))
                {
                    const string insertSql = @"
INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, MsgWA_TemplateName, MsgWA_Token, StorageType)
VALUES ('', '', '', '', '', 'LocalServer')";
                    conn.Execute(insertSql, transaction: tran);
                }
                else
                {
                    const string insertLegacySql = @"
INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage)
VALUES ('', '', '')";
                    conn.Execute(insertLegacySql, transaction: tran);
                }
            }
        }

        public ResponseModelApplicationSetting GetSetting(IDbConnection conn, IDbTransaction? tran = null)
        {
            EnsureTable(conn, tran);

            bool hasTemplateName = ColumnExists(conn, tran, "MsgWA_TemplateName");
            bool hasStorageType = ColumnExists(conn, tran, "StorageType");
            bool hasToken = ColumnExists(conn, tran, "MsgWA_Token");

            string sql = $@"
            SELECT TOP 1
                ISNULL(MsgTemplate, '') AS msgTemplate,
                ISNULL(MsgLink, '') AS msgLink,
                ISNULL(MsgImage, '') AS msgImage,
                {(hasTemplateName ? "ISNULL(MsgWA_TemplateName, '')" : "''")} AS whatsappTemplateName,
                {(hasToken ? "ISNULL(MsgWA_Token, '')" : "''")} AS whatsappGatewayToken,
                {(hasStorageType ? "ISNULL(StorageType, 'LocalServer')" : "'LocalServer'")} AS storageType
            FROM dbo.MsProg";

            return conn.QueryFirstOrDefault<ResponseModelApplicationSetting>(sql, transaction: tran)
                   ?? new ResponseModelApplicationSetting();
        }

        public void Upsert(RequestUpdateApplicationSetting request, IDbConnection conn, IDbTransaction tran)
        {
            EnsureTable(conn, tran);

            bool hasTemplateName = ColumnExists(conn, tran, "MsgWA_TemplateName");
            bool hasStorageType = ColumnExists(conn, tran, "StorageType");
            bool hasToken = ColumnExists(conn, tran, "MsgWA_Token");

            if (hasTemplateName && hasStorageType && hasToken)
            {
                const string sql = @"
UPDATE dbo.MsProg
SET
    MsgTemplate = @MsgTemplate,
    MsgLink = @MsgLink,
    MsgImage = @MsgImage,
    MsgWA_TemplateName = @MsgWA_TemplateName,
    MsgWA_Token = @MsgWA_Token,
    StorageType = @StorageType;

IF @@ROWCOUNT = 0
BEGIN
    INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, MsgWA_TemplateName, MsgWA_Token, StorageType)
    VALUES (@MsgTemplate, @MsgLink, @MsgImage, @MsgWA_TemplateName, @MsgWA_Token, @StorageType);
END";

                conn.Execute(sql, new
                {
                    MsgTemplate = request.msgTemplate ?? "",
                    MsgLink = request.msgLink ?? "",
                    MsgImage = request.existingMsgImage ?? "",
                    MsgWA_TemplateName = request.whatsappTemplateName ?? "",
                    MsgWA_Token = request.whatsappGatewayToken ?? "",
                    StorageType = NormalizeStorageType(request.storageType)
                }, tran);

                return;
            }

            const string legacySql = @"
UPDATE dbo.MsProg
SET
    MsgTemplate = @MsgTemplate,
    MsgLink = @MsgLink,
    MsgImage = @MsgImage;

IF @@ROWCOUNT = 0
BEGIN
    INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage)
    VALUES (@MsgTemplate, @MsgLink, @MsgImage);
END";

            conn.Execute(legacySql, new
            {
                MsgTemplate = request.msgTemplate ?? "",
                MsgLink = request.msgLink ?? "",
                MsgImage = request.existingMsgImage ?? ""
            }, tran);
        }

        private string NormalizeStorageType(string? storageType)
        {
            return string.Equals(storageType, "GoogleCloud", StringComparison.OrdinalIgnoreCase)
                ? "GoogleCloud"
                : "LocalServer";
        }

        private bool TableExists(IDbConnection conn, IDbTransaction? tran)
        {
            const string sql = "SELECT CASE WHEN OBJECT_ID('dbo.MsProg', 'U') IS NULL THEN 0 ELSE 1 END";
            return conn.ExecuteScalar<int>(sql, transaction: tran) == 1;
        }

        private bool HasAnyRow(IDbConnection conn, IDbTransaction? tran)
        {
            const string sql = "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.MsProg) THEN 1 ELSE 0 END";
            return conn.ExecuteScalar<int>(sql, transaction: tran) == 1;
        }

        private bool ColumnExists(IDbConnection conn, IDbTransaction? tran, string columnName)
        {
            const string sql = "SELECT CASE WHEN COL_LENGTH('dbo.MsProg', @ColumnName) IS NULL THEN 0 ELSE 1 END";
            return conn.ExecuteScalar<int>(sql, new { ColumnName = columnName }, tran) == 1;
        }

        private void TryEnsureColumn(IDbConnection conn, IDbTransaction? tran, string columnName, string alterSql)
        {
            if (ColumnExists(conn, tran, columnName))
            {
                return;
            }

            try
            {
                conn.Execute(alterSql, transaction: tran);
            }
            catch
            {
                // Production login bisa jadi tidak punya ALTER privilege.
                // Kolom akan dianggap optional sampai migration dijalankan oleh DBA.
            }
        }
    }
}
