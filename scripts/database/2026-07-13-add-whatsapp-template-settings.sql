/*
    WEB DOA - WhatsApp Application Setting migration
    Commit source: 4596e89 (2026-07-13, "update send wa")

    Adds the two MsProg columns introduced by the update:
    - MsgWA_PhoneNumberId
    - MsgWA_VoiceTemplateName

    The script is idempotent and preserves existing configured values.
*/

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.MsProg', 'U') IS NULL
    BEGIN
        ;THROW 51000, 'Tabel dbo.MsProg belum tersedia. Jalankan migration Application Setting dasar terlebih dahulu.', 1;
    END;

    IF COL_LENGTH('dbo.MsProg', 'MsgWA_PhoneNumberId') IS NULL
    BEGIN
        ALTER TABLE dbo.MsProg
        ADD MsgWA_PhoneNumberId NVARCHAR(100) NOT NULL
            CONSTRAINT DF_MsProg_MsgWA_PhoneNumberId_20260713
            DEFAULT ('cmp3vlf4z01qnwx9k8k1aduwk') WITH VALUES;
    END;

    IF COL_LENGTH('dbo.MsProg', 'MsgWA_VoiceTemplateName') IS NULL
    BEGIN
        ALTER TABLE dbo.MsProg
        ADD MsgWA_VoiceTemplateName NVARCHAR(100) NOT NULL
            CONSTRAINT DF_MsProg_MsgWA_VoiceTemplateName_20260713
            DEFAULT ('doa_selamat_ulang_tahun') WITH VALUES;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
