using API.Repository.global;
using Dapper;
using System.Data;

namespace API.Repository.Master
{
    public class RepoApplicationSetting
    {
        public ResponseModelApplicationSetting GetSetting(IDbConnection conn, IDbTransaction? tran = null)
        {
            const string sql = @"
            SELECT TOP 1
                ISNULL(MsgTemplate, '') AS msgTemplate,
                ISNULL(MsgLink, '') AS msgLink,
                ISNULL(MsgImage, '') AS msgImage,
                ISNULL(MsgWA_TemplateName, '') AS whatsappTemplateName,
                ISNULL(MsgWA_VoiceTemplateName, 'doa_selamat_ulang_tahun') AS whatsappVoiceTemplateName,
                ISNULL(MsgWA_Token, '') AS whatsappGatewayToken,
                ISNULL(MsgWA_PhoneNumberId, 'cmp3vlf4z01qnwx9k8k1aduwk') AS whatsappPhoneNumberId,
                ISNULL(StorageType, 'LocalServer') AS storageType,
                ISNULL(BirthdayDashboardBeginDateOffsetDays, 0) AS birthdayDashboardBeginDateOffsetDays
            FROM dbo.MsProg";

            return conn.QueryFirstOrDefault<ResponseModelApplicationSetting>(sql, transaction: tran)
                   ?? new ResponseModelApplicationSetting();
        }

        public void Upsert(RequestUpdateApplicationSetting request, IDbConnection conn, IDbTransaction tran)
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
        }

        private string NormalizeStorageType(string? storageType)
        {
            return string.Equals(storageType, "GoogleCloud", StringComparison.OrdinalIgnoreCase)
                ? "GoogleCloud"
                : "LocalServer";
        }

    }
}
