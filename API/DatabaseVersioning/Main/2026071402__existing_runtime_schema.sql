SET NOCOUNT ON;

IF OBJECT_ID('dbo.MsProg', 'U') IS NULL
BEGIN
    EXEC(N'
CREATE TABLE dbo.MsProg
(
    MsgTemplate NVARCHAR(MAX) NOT NULL CONSTRAINT DF_MsProg_MsgTemplate DEFAULT (''''),
    MsgLink NVARCHAR(255) NOT NULL CONSTRAINT DF_MsProg_MsgLink DEFAULT (''''),
    MsgImage NVARCHAR(255) NOT NULL CONSTRAINT DF_MsProg_MsgImage DEFAULT (''''),
    MsgWA_TemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_TemplateName DEFAULT (''''),
    MsgWA_VoiceTemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_VoiceTemplateName DEFAULT (''doa_selamat_ulang_tahun''),
    MsgWA_Token NVARCHAR(500) NOT NULL CONSTRAINT DF_MsProg_MsgWA_Token DEFAULT (''''),
    MsgWA_PhoneNumberId NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_PhoneNumberId DEFAULT (''cmp3vlf4z01qnwx9k8k1aduwk''),
    StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType DEFAULT (''LocalServer''),
    BirthdayDashboardBeginDateOffsetDays INT NOT NULL CONSTRAINT DF_MsProg_BirthdayDashboardBeginDateOffsetDays DEFAULT ((0))
);');
END;

IF COL_LENGTH('dbo.MsProg', 'MsgWA_TemplateName') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.MsProg ADD MsgWA_TemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_TemplateName_Alter DEFAULT ('''')');
END;

IF COL_LENGTH('dbo.MsProg', 'MsgWA_VoiceTemplateName') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.MsProg ADD MsgWA_VoiceTemplateName NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_VoiceTemplateName_Alter DEFAULT (''doa_selamat_ulang_tahun'')');
END;

IF COL_LENGTH('dbo.MsProg', 'StorageType') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.MsProg ADD StorageType NVARCHAR(50) NOT NULL CONSTRAINT DF_MsProg_StorageType_Alter DEFAULT (''LocalServer'')');
END;

IF COL_LENGTH('dbo.MsProg', 'MsgWA_Token') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.MsProg ADD MsgWA_Token NVARCHAR(500) NOT NULL CONSTRAINT DF_MsProg_MsgWA_Token_Alter DEFAULT ('''')');
END;

IF COL_LENGTH('dbo.MsProg', 'MsgWA_PhoneNumberId') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.MsProg ADD MsgWA_PhoneNumberId NVARCHAR(100) NOT NULL CONSTRAINT DF_MsProg_MsgWA_PhoneNumberId_Alter DEFAULT (''cmp3vlf4z01qnwx9k8k1aduwk'')');
END;

IF COL_LENGTH('dbo.MsProg', 'BirthdayDashboardBeginDateOffsetDays') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.MsProg ADD BirthdayDashboardBeginDateOffsetDays INT NOT NULL CONSTRAINT DF_MsProg_BirthdayDashboardBeginDateOffsetDays_Alter DEFAULT ((0))');
END;

EXEC(N'
IF NOT EXISTS (SELECT 1 FROM dbo.MsProg)
BEGIN
    INSERT INTO dbo.MsProg
        (MsgTemplate, MsgLink, MsgImage, MsgWA_TemplateName, MsgWA_VoiceTemplateName, MsgWA_Token, MsgWA_PhoneNumberId, StorageType, BirthdayDashboardBeginDateOffsetDays)
    VALUES
        ('''', '''', '''', '''', ''doa_selamat_ulang_tahun'', '''', ''cmp3vlf4z01qnwx9k8k1aduwk'', ''LocalServer'', 0);
END;');

IF OBJECT_ID('dbo.WhatsAppScheduleSetting', 'U') IS NULL
BEGIN
    EXEC(N'
CREATE TABLE dbo.WhatsAppScheduleSetting
(
    id_setting BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SendTime TIME NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_SendTime DEFAULT (''08:00:00''),
    IsActive BIT NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_IsActive DEFAULT ((0)),
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_CreatedDate DEFAULT (GETDATE()),
    UpdatedDate DATETIME NOT NULL CONSTRAINT DF_WhatsAppScheduleSetting_UpdatedDate DEFAULT (GETDATE())
);');
END;

EXEC(N'
IF NOT EXISTS (SELECT 1 FROM dbo.WhatsAppScheduleSetting)
BEGIN
    INSERT INTO dbo.WhatsAppScheduleSetting (SendTime, IsActive)
    VALUES (''08:00:00'', 0);
END;');

IF OBJECT_ID('dbo.TRBirthdayPrayWASendLog', 'U') IS NULL
BEGIN
    EXEC(N'
CREATE TABLE dbo.TRBirthdayPrayWASendLog
(
    id_sendlog BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_TRBirthdayPray BIGINT NOT NULL,
    BirthdayDate DATE NOT NULL,
    SentAt DATETIME NOT NULL CONSTRAINT DF_TRBirthdayPrayWASendLog_SentAt DEFAULT (GETDATE()),
    Success BIT NOT NULL,
    ResponseMessage NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBirthdayPrayWASendLog_ResponseMessage DEFAULT ('''')
);');
END;

IF OBJECT_ID('dbo.VoiceRecordings', 'U') IS NULL
BEGIN
    EXEC(N'
CREATE TABLE dbo.VoiceRecordings
(
    Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Provider NVARCHAR(50) NOT NULL CONSTRAINT DF_VoiceRecordings_Provider DEFAULT (''LocalServer''),
    FileName NVARCHAR(255) NOT NULL,
    BucketName NVARCHAR(255) NOT NULL,
    ObjectName NVARCHAR(500) NOT NULL,
    StoragePath NVARCHAR(1000) NOT NULL CONSTRAINT DF_VoiceRecordings_StoragePath DEFAULT (''''),
    FileUrl NVARCHAR(1000) NULL,
    ContentType NVARCHAR(100) NOT NULL,
    FileSize BIGINT NOT NULL,
    CreatedAt DATETIME NOT NULL CONSTRAINT DF_VoiceRecordings_CreatedAt DEFAULT (GETDATE())
);');
END;

IF COL_LENGTH('dbo.VoiceRecordings', 'Provider') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.VoiceRecordings ADD Provider NVARCHAR(50) NOT NULL CONSTRAINT DF_VoiceRecordings_Provider_Alter DEFAULT (''LocalServer'')');
END;

IF COL_LENGTH('dbo.VoiceRecordings', 'StoragePath') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.VoiceRecordings ADD StoragePath NVARCHAR(1000) NOT NULL CONSTRAINT DF_VoiceRecordings_StoragePath_Alter DEFAULT ('''')');
END;

IF OBJECT_ID('dbo.TRBuletin', 'U') IS NULL
BEGIN
    EXEC(N'
CREATE TABLE dbo.TRBuletin
(
    id_TRBuletin BIGINT NOT NULL PRIMARY KEY,
    [Description] VARCHAR(100) NOT NULL,
    PesanText NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_Pesan DEFAULT (''''),
    PathFile NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_PathFile DEFAULT (''''),
    CreatedDate DATETIME NOT NULL CONSTRAINT DF_TRBuletin_CreatedDate DEFAULT (GETDATE())
);');
END;

IF COL_LENGTH('dbo.TRBuletin', 'PesanText') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.TRBuletin ADD PesanText NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_Pesan_Alter DEFAULT ('''')');
END;

IF COL_LENGTH('dbo.TRBuletin', 'PathFile') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.TRBuletin ADD PathFile NVARCHAR(MAX) NOT NULL CONSTRAINT DF_TRBuletin_PathFile_Alter DEFAULT ('''')');
END;

IF COL_LENGTH('dbo.TRBuletin', 'CreatedDate') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.TRBuletin ADD CreatedDate DATETIME NOT NULL CONSTRAINT DF_TRBuletin_CreatedDate_Alter DEFAULT (GETDATE())');
END;
