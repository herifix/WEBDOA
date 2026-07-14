using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Master
{
    public class RepoApplicationSetting
    {
        private const string DefaultWhatsAppPhoneNumberId = "cmp3vlf4z01qnwx9k8k1aduwk";
        private const string DefaultWhatsAppVoiceTemplateName = "doa_selamat_ulang_tahun";

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
    MsgWA_VoiceTemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_VoiceTemplateName DEFAULT ('doa_selamat_ulang_tahun'),
    MsgWA_Token NVARCHAR(500) NOT NULL CONSTRAINT DF_MsProg_MsgWA_Token DEFAULT (''),
    MsgWA_PhoneNumberId NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_PhoneNumberId DEFAULT ('cmp3vlf4z01qnwx9k8k1aduwk'),
    StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType DEFAULT ('LocalServer'),
    BirthdayDashboardBeginDateOffsetDays INT NOT NULL CONSTRAINT DF_MsProg_BirthdayDashboardBeginDateOffsetDays DEFAULT ((0))
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
            TryEnsureColumn(conn, tran, "MsgWA_VoiceTemplateName", "ALTER TABLE dbo.MsProg ADD MsgWA_VoiceTemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_VoiceTemplateName_Alter DEFAULT ('doa_selamat_ulang_tahun')");
            TryEnsureColumn(conn, tran, "StorageType", "ALTER TABLE dbo.MsProg ADD StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType_Alter DEFAULT ('LocalServer')");
            TryEnsureColumn(conn, tran, "MsgWA_Token", "ALTER TABLE dbo.MsProg ADD MsgWA_Token NVARCHAR(500) NOT NULL CONSTRAINT DF_MsProg_MsgWA_Token_Alter DEFAULT ('')");
            TryEnsureColumn(conn, tran, "MsgWA_PhoneNumberId", "ALTER TABLE dbo.MsProg ADD MsgWA_PhoneNumberId NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_PhoneNumberId_Alter DEFAULT ('cmp3vlf4z01qnwx9k8k1aduwk')");
            TryEnsureColumn(conn, tran, "BirthdayDashboardBeginDateOffsetDays", "ALTER TABLE dbo.MsProg ADD BirthdayDashboardBeginDateOffsetDays INT NOT NULL CONSTRAINT DF_MsProg_BirthdayDashboardBeginDateOffsetDays_Alter DEFAULT ((0))");

            if (!HasAnyRow(conn, tran))
            {
                if (ColumnExists(conn, tran, "MsgWA_Token") && ColumnExists(conn, tran, "MsgWA_TemplateName") && ColumnExists(conn, tran, "MsgWA_VoiceTemplateName") && ColumnExists(conn, tran, "MsgWA_PhoneNumberId") && ColumnExists(conn, tran, "StorageType") && ColumnExists(conn, tran, "BirthdayDashboardBeginDateOffsetDays"))
                {
                    const string insertSql = @"
INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, MsgWA_TemplateName, MsgWA_VoiceTemplateName, MsgWA_Token, MsgWA_PhoneNumberId, StorageType, BirthdayDashboardBeginDateOffsetDays)
VALUES ('', '', '', '', 'doa_selamat_ulang_tahun', '', 'cmp3vlf4z01qnwx9k8k1aduwk', 'LocalServer', 0)";
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
            bool hasVoiceTemplateName = ColumnExists(conn, tran, "MsgWA_VoiceTemplateName");
            bool hasStorageType = ColumnExists(conn, tran, "StorageType");
            bool hasToken = ColumnExists(conn, tran, "MsgWA_Token");
            bool hasPhoneNumberId = ColumnExists(conn, tran, "MsgWA_PhoneNumberId");
            bool hasBirthdayDashboardBeginDateOffsetDays = ColumnExists(conn, tran, "BirthdayDashboardBeginDateOffsetDays");

            string sql = $@"
            SELECT TOP 1
                ISNULL(MsgTemplate, '') AS msgTemplate,
                ISNULL(MsgLink, '') AS msgLink,
                ISNULL(MsgImage, '') AS msgImage,
                {(hasTemplateName ? "ISNULL(MsgWA_TemplateName, '')" : "''")} AS whatsappTemplateName,
                {(hasVoiceTemplateName ? "ISNULL(MsgWA_VoiceTemplateName, '')" : $"'{DefaultWhatsAppVoiceTemplateName}'")} AS whatsappVoiceTemplateName,
                {(hasToken ? "ISNULL(MsgWA_Token, '')" : "''")} AS whatsappGatewayToken,
                {(hasPhoneNumberId ? "ISNULL(MsgWA_PhoneNumberId, '')" : $"'{DefaultWhatsAppPhoneNumberId}'")} AS whatsappPhoneNumberId,
                {(hasStorageType ? "ISNULL(StorageType, 'LocalServer')" : "'LocalServer'")} AS storageType,
                {(hasBirthdayDashboardBeginDateOffsetDays ? "ISNULL(BirthdayDashboardBeginDateOffsetDays, 0)" : "0")} AS birthdayDashboardBeginDateOffsetDays
            FROM dbo.MsProg";

            return conn.QueryFirstOrDefault<ResponseModelApplicationSetting>(sql, transaction: tran)
                   ?? new ResponseModelApplicationSetting();
        }

        public void Upsert(RequestUpdateApplicationSetting request, IDbConnection conn, IDbTransaction tran)
        {
            EnsureTable(conn, tran);

            bool hasTemplateName = ColumnExists(conn, tran, "MsgWA_TemplateName");
            bool hasVoiceTemplateName = ColumnExists(conn, tran, "MsgWA_VoiceTemplateName");
            bool hasStorageType = ColumnExists(conn, tran, "StorageType");
            bool hasToken = ColumnExists(conn, tran, "MsgWA_Token");
            bool hasPhoneNumberId = ColumnExists(conn, tran, "MsgWA_PhoneNumberId");
            bool hasBirthdayDashboardBeginDateOffsetDays = ColumnExists(conn, tran, "BirthdayDashboardBeginDateOffsetDays");

            if (hasTemplateName && hasVoiceTemplateName && hasStorageType && hasToken && hasPhoneNumberId && hasBirthdayDashboardBeginDateOffsetDays)
            {
                const string sql = @"
UPDATE dbo.MsProg
SET
    MsgTemplate = @MsgTemplate,
    MsgLink = @MsgLink,
    MsgImage = @MsgImage,
    MsgWA_TemplateName = @MsgWA_TemplateName,
    MsgWA_VoiceTemplateName = @MsgWA_VoiceTemplateName,
    MsgWA_Token = @MsgWA_Token,
    MsgWA_PhoneNumberId = @MsgWA_PhoneNumberId,
    StorageType = @StorageType,
    BirthdayDashboardBeginDateOffsetDays = COALESCE(@BirthdayDashboardBeginDateOffsetDays, BirthdayDashboardBeginDateOffsetDays);

IF @@ROWCOUNT = 0
BEGIN
    INSERT INTO dbo.MsProg (MsgTemplate, MsgLink, MsgImage, MsgWA_TemplateName, MsgWA_VoiceTemplateName, MsgWA_Token, MsgWA_PhoneNumberId, StorageType, BirthdayDashboardBeginDateOffsetDays)
    VALUES (@MsgTemplate, @MsgLink, @MsgImage, @MsgWA_TemplateName, @MsgWA_VoiceTemplateName, @MsgWA_Token, @MsgWA_PhoneNumberId, @StorageType, COALESCE(@BirthdayDashboardBeginDateOffsetDays, 0));
END";

                conn.Execute(sql, new
                {
                    MsgTemplate = request.msgTemplate ?? "",
                    MsgLink = request.msgLink ?? "",
                    MsgImage = request.existingMsgImage ?? "",
                    MsgWA_TemplateName = request.whatsappTemplateName ?? "",
                    MsgWA_VoiceTemplateName = request.whatsappVoiceTemplateName?.Trim() ?? "",
                    MsgWA_Token = request.whatsappGatewayToken ?? "",
                    MsgWA_PhoneNumberId = request.whatsappPhoneNumberId?.Trim() ?? "",
                    StorageType = NormalizeStorageType(request.storageType),
                    BirthdayDashboardBeginDateOffsetDays = request.birthdayDashboardBeginDateOffsetDays
                }, tran);

                return;
            }

            if (!hasVoiceTemplateName)
            {
                throw new InvalidOperationException(
                    "Kolom MsProg.MsgWA_VoiceTemplateName belum tersedia. Jalankan migration oleh DBA sebelum menyimpan WA Voice Template Name.");
            }

            if (!hasPhoneNumberId)
            {
                throw new InvalidOperationException(
                    "Kolom MsProg.MsgWA_PhoneNumberId belum tersedia. Jalankan migration oleh DBA sebelum menyimpan WA Phone Number ID.");
            }

            throw new InvalidOperationException(
                "Kolom Application Setting pada MsProg belum lengkap. Jalankan migration oleh DBA sebelum menyimpan pengaturan WhatsApp.");
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
