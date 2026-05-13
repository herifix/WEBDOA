# INSTRUKSI AI AGENT - IMPLEMENTASI APPROVAL TRPR

Tujuan:
Buat implementasi sistem approval pada modul/page TRPR dengan konsep:

- Saat create pertama, status otomatis DRAFT.
- Tombol toolbar "Ready To Approve" muncul hanya jika modul PR memiliki setting approval aktif.
- Saat user klik "Ready To Approve", status berubah menjadi WAITING_APPROVE.
- Data baru muncul di Dashboard Approval setelah status WAITING_APPROVE.
- Stored procedure utama adalah SP_TRPR_ReadyToApprove.
- SP_TRPR_ReadyToApprove harus reusable/multi modul menggunakan parameter id_form.
- Sistem memakai 2 database tetapi aplikasi cukup memakai 1 koneksi saat memanggil SP.
- Akses ke tabel approval pusat dilakukan dengan pola:
  [InventoryAktif].dbo.NamaTabelApproval
  contoh:
  [InventoryTES].dbo.MsApprovalModuleSetting
  [InventoryERP].dbo.TrApprovalRequest
- InventoryAktif dikirim sebagai parameter atau dibaca dari config, misalnya InventoryTES untuk DEV dan InventoryERP untuk PROD.

==================================================

1. # DATABASE CONTEXT

Ada 2 jenis database:

A. Database transaksi aktif
Contoh:

- GK2026IN
- GK2027IN
- database cabang/perusahaan lain

Di database transaksi terdapat tabel:

- dbo.TRPR

B. Database approval pusat
Contoh:

- InventoryTES untuk DEV
- InventoryERP untuk PROD

Di database approval pusat terdapat tabel:

- dbo.MsForm
- dbo.MsApprovalStatus
- dbo.MsApprovalMethod
- dbo.MsApprovalModuleSetting
- dbo.MsApprovalAmountRule
- dbo.MsApprovalApprover
- dbo.TrApprovalRequest
- dbo.TrApprovalRequestApprover
- dbo.TrApprovalRequestActionLog

Catatan penting:

- Jangan buat foreign key lintas database.
- TRPR hanya menyimpan ApprovalStatusID dan ApprovalRequestID sebagai reference ringan.
- Dashboard approval membaca dari database approval pusat, bukan dari database transaksi.
- Aplikasi cukup call SP dari database transaksi dengan 1 koneksi.
- SP yang berada di database transaksi boleh mengakses database approval pusat dengan dynamic database name:
  QUOTENAME(@InventoryAktif) + '.dbo.NamaTabel'

================================================== 2. STATUS APPROVAL
==================================================

Gunakan status fixed berikut:

0 = DRAFT
1 = WAITING_APPROVE
2 = APPROVE
3 = REJECT

Kode status:

- DRAFT
- WAITING_APPROVE
- APPROVE
- REJECT

Flow status TRPR:

DRAFT
-> klik Ready To Approve
WAITING_APPROVE
-> approver approve
APPROVE

WAITING_APPROVE
-> approver reject
REJECT

Rule:

- Saat create TRPR:
  ApprovalStatusID = 0
  approve_status = 'DRAFT'

- Saat Ready To Approve:
  ApprovalStatusID = 1
  approve_status = 'WAITING_APPROVE'

- Saat final approve:
  ApprovalStatusID = 2
  approve_status = 'APPROVE'

- Saat reject:
  ApprovalStatusID = 3
  approve_status = 'REJECT'

================================================== 3. TABEL TRPR
==================================================

Struktur TRPR yang sudah ada:

CREATE TABLE [dbo].[TRPR](
[id_pr] [bigint] IDENTITY(1,1) NOT NULL,
[prno] [nvarchar](20) NOT NULL,
[prdate] [date] NOT NULL,
[id_dept] [bigint] NOT NULL,
[note] [nvarchar](500) NULL,
[approve_status] [nvarchar](20) NULL,
[CreatedBy] [nvarchar](50) NOT NULL,
[CreatedDate] [datetime] NOT NULL,
[CreatedFromModul] [nvarchar](50) NOT NULL,
[LastUpdatedBy] [nvarchar](50) NOT NULL,
[LastUpdatedDate] [datetime] NOT NULL,
[LastUpdatedFromModul] [nvarchar](50) NOT NULL,
[ApprovalStatusID] [tinyint] NOT NULL,
CONSTRAINT [PK_TRPR] PRIMARY KEY CLUSTERED ([prno] ASC)
)

Catatan:

- PK saat ini adalah prno.
- Untuk approval request gunakan id_pr sebagai TransactionID karena id_pr adalah bigint identity dan lebih stabil untuk reference.
- Jangan gunakan prno sebagai TransactionID karena prno adalah nvarchar.

================================================== 4. TAMBAHAN FIELD UNTUK TRPR
==================================================

Tambahkan ApprovalRequestID di TRPR jika belum ada.

SQL:

IF COL_LENGTH('dbo.TRPR', 'ApprovalRequestID') IS NULL
BEGIN
ALTER TABLE dbo.TRPR
ADD ApprovalRequestID BIGINT NULL;
END;
GO

Tambahkan unique index untuk id_pr jika belum ada:

IF NOT EXISTS (
SELECT 1
FROM sys.indexes
WHERE name = 'UX_TRPR_id_pr'
AND object_id = OBJECT_ID('dbo.TRPR')
)
BEGIN
CREATE UNIQUE INDEX UX_TRPR_id_pr
ON dbo.TRPR(id_pr);
END;
GO

Tambahkan default ApprovalStatusID = 0 jika belum ada:

IF NOT EXISTS (
SELECT 1
FROM sys.default_constraints dc
INNER JOIN sys.columns c
ON c.object_id = dc.parent_object_id
AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.TRPR')
AND c.name = 'ApprovalStatusID'
)
BEGIN
ALTER TABLE dbo.TRPR
ADD CONSTRAINT DF_TRPR_ApprovalStatusID
DEFAULT (0) FOR ApprovalStatusID;
END;
GO

Tambahkan default approve_status = 'DRAFT' jika belum ada:

IF NOT EXISTS (
SELECT 1
FROM sys.default_constraints dc
INNER JOIN sys.columns c
ON c.object_id = dc.parent_object_id
AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.TRPR')
AND c.name = 'approve_status'
)
BEGIN
ALTER TABLE dbo.TRPR
ADD CONSTRAINT DF_TRPR_approve_status
DEFAULT (N'DRAFT') FOR approve_status;
END;
GO

================================================== 5. FLOW LOAD PAGE TRPR
==================================================

Saat page TRPR dibuka:

1. Frontend load data TRPR.
2. Frontend/backend juga membaca setting approval modul berdasarkan id_form.
3. Backend membaca setting dari:
   [InventoryAktif].dbo.MsApprovalModuleSetting
4. Jika setting aktif dan PerluApproval = 1, maka tombol toolbar "Ready To Approve" boleh muncul.
5. Tombol hanya muncul jika status transaksi masih DRAFT.

Query konsep:

SELECT TOP 1
ams.ApprovalSettingID,
ams.id_form,
ams.PerluApproval,
ams.ApprovalMethodID,
am.MethodCode,
am.MethodName,
ams.MinimalApproval,
ams.IsActive
FROM [InventoryAktif].dbo.MsApprovalModuleSetting ams
INNER JOIN [InventoryAktif].dbo.MsApprovalMethod am
ON am.ApprovalMethodID = ams.ApprovalMethodID
WHERE ams.id_form = @id_form
AND ams.IsActive = 1;

Rule tampilan tombol:

showReadyToApprove = true jika:

- setting approval ditemukan
- PerluApproval = 1
- IsActive = 1
- data TRPR sudah tersimpan dan punya id_pr
- ApprovalStatusID = 0 / DRAFT

showReadyToApprove = false jika:

- setting tidak ditemukan
- PerluApproval = 0
- IsActive = 0
- data belum disimpan
- ApprovalStatusID bukan DRAFT

================================================== 6. SP GET MODULE SETTING
==================================================

Buat SP ini di database transaksi agar aplikasi tetap call dengan 1 koneksi.

CREATE OR ALTER PROCEDURE dbo.SP_Approval_GetModuleSetting
@id_form BIGINT,
@InventoryAktif SYSNAME
AS
BEGIN
SET NOCOUNT ON;

    DECLARE @sql NVARCHAR(MAX);

    IF DB_ID(@InventoryAktif) IS NULL
    BEGIN
        THROW 50101, 'Database approval pusat tidak ditemukan.', 1;
    END;

    SET @sql = N'

SELECT TOP 1
ams.ApprovalSettingID,
ams.id_form,
ams.PerluApproval,
ams.ApprovalMethodID,
am.MethodCode,
am.MethodName,
ams.MinimalApproval,
ams.IsActive
FROM ' + QUOTENAME(@InventoryAktif) + N'.dbo.MsApprovalModuleSetting ams
INNER JOIN ' + QUOTENAME(@InventoryAktif) + N'.dbo.MsApprovalMethod am
ON am.ApprovalMethodID = ams.ApprovalMethodID
WHERE ams.id_form = @id_form
AND ams.IsActive = 1;
';

    EXEC sp_executesql
        @sql,
        N'@id_form BIGINT',
        @id_form = @id_form;

END;
GO

================================================== 7. FLOW CREATE TRPR
==================================================

Saat create TRPR:

- Jangan langsung masuk dashboard approval.
- Jangan insert TrApprovalRequest.
- Jangan insert TrApprovalRequestApprover.
- Status harus DRAFT.

SQL insert TRPR harus memastikan:

ApprovalStatusID = 0
approve_status = N'DRAFT'

Contoh:

INSERT INTO dbo.TRPR
(
prno,
prdate,
id_dept,
note,
approve_status,
CreatedBy,
CreatedDate,
CreatedFromModul,
LastUpdatedBy,
LastUpdatedDate,
LastUpdatedFromModul,
ApprovalStatusID
)
VALUES
(
@prno,
@prdate,
@id_dept,
@note,
N'DRAFT',
@UserName,
GETDATE(),
@FromModul,
@UserName,
GETDATE(),
@FromModul,
0
);

================================================== 8. FLOW READY TO APPROVE
==================================================

Saat user klik toolbar "Ready To Approve":

Frontend call:
POST /api/trpr/{idPr}/ready-to-approve

Backend:

1. Ambil UserID dari token/session.
2. Ambil UserName dari token/session.
3. Ambil id_form modul PR dari frontend/config.
4. Ambil InventoryAktif dari config.
5. Jika approval method based on amount, backend hitung total amount PR dari detail PR lalu kirim ke SP sebagai @TransactionAmount.
6. Call SP_TRPR_ReadyToApprove.

SP_TRPR_ReadyToApprove:

1. Validasi database approval pusat ada.
2. Lock row TRPR dengan UPDLOCK, ROWLOCK.
3. Pastikan TRPR ditemukan.
4. Pastikan ApprovalStatusID masih DRAFT.
5. Baca setting approval dari [InventoryAktif].dbo.MsApprovalModuleSetting berdasarkan id_form.
6. Pastikan PerluApproval = 1 dan IsActive = 1.
7. Pastikan ApprovalMethodID valid dan bukan 0.
8. Jika method BASED_ON_AMOUNT, cari amount rule.
9. Cek agar transaksi belum pernah dibuatkan approval request.
10. Insert header ke [InventoryAktif].dbo.TrApprovalRequest.
11. Insert daftar approver ke [InventoryAktif].dbo.TrApprovalRequestApprover dari [InventoryAktif].dbo.MsApprovalApprover.
12. Jika approver kosong, rollback.
13. Update dbo.TRPR menjadi WAITING_APPROVE.
14. Commit transaction.
15. Return ApprovalRequestID, id_pr, prno, ApprovalStatusID, approve_status, ApproverCount.

================================================== 9. SP_TRPR_ReadyToApprove FINAL
==================================================

Buat SP ini di database transaksi.

CREATE OR ALTER PROCEDURE dbo.SP_TRPR_ReadyToApprove
@id_pr BIGINT,
@id_form BIGINT,
@LoginUserID BIGINT,
@UserName NVARCHAR(50),
@InventoryAktif SYSNAME,
@FromModul NVARCHAR(50) = N'TRPR',
@TransactionAmount DECIMAL(19,4) = NULL
AS
BEGIN
SET NOCOUNT ON;
SET XACT_ABORT ON;

    DECLARE
        @DraftStatus TINYINT = 0,
        @WaitingStatus TINYINT = 1,
        @ApprovalSettingID BIGINT,
        @ApprovalMethodID TINYINT,
        @MinimalApproval SMALLINT,
        @PerluApproval BIT,
        @ApprovalAmountRuleID BIGINT = NULL,
        @ApprovalRequestID BIGINT,
        @ExistingApprovalRequestID BIGINT,
        @ApproverCount INT = 0,
        @prno NVARCHAR(20),
        @prdate DATE,
        @note NVARCHAR(500),
        @CurrentApprovalStatusID TINYINT,
        @SourceDbName SYSNAME = DB_NAME(),
        @SourceSchemaName SYSNAME = N'dbo',
        @SourceTableName SYSNAME = N'TRPR',
        @sql NVARCHAR(MAX);

    IF DB_ID(@InventoryAktif) IS NULL
    BEGIN
        THROW 50001, 'Database approval pusat tidak ditemukan.', 1;
    END;

    BEGIN TRY
        BEGIN TRAN;

        SELECT
            @prno = prno,
            @prdate = prdate,
            @note = note,
            @CurrentApprovalStatusID = ApprovalStatusID
        FROM dbo.TRPR WITH (UPDLOCK, ROWLOCK)
        WHERE id_pr = @id_pr;

        IF @prno IS NULL
        BEGIN
            THROW 50002, 'Data TRPR tidak ditemukan.', 1;
        END;

        IF @CurrentApprovalStatusID <> @DraftStatus
        BEGIN
            THROW 50003, 'TRPR hanya bisa Ready To Approve dari status DRAFT.', 1;
        END;

        SET @sql = N'

SELECT
@ApprovalSettingID = ams.ApprovalSettingID,
@PerluApproval = ams.PerluApproval,
@ApprovalMethodID = ams.ApprovalMethodID,
@MinimalApproval = ams.MinimalApproval
FROM ' + QUOTENAME(@InventoryAktif) + N'.dbo.MsApprovalModuleSetting ams
WHERE ams.id_form = @id_form
AND ams.IsActive = 1;
';

        EXEC sp_executesql
            @sql,
            N'
                @id_form BIGINT,
                @ApprovalSettingID BIGINT OUTPUT,
                @PerluApproval BIT OUTPUT,
                @ApprovalMethodID TINYINT OUTPUT,
                @MinimalApproval SMALLINT OUTPUT
            ',
            @id_form = @id_form,
            @ApprovalSettingID = @ApprovalSettingID OUTPUT,
            @PerluApproval = @PerluApproval OUTPUT,
            @ApprovalMethodID = @ApprovalMethodID OUTPUT,
            @MinimalApproval = @MinimalApproval OUTPUT;

        IF ISNULL(@PerluApproval, 0) = 0
        BEGIN
            THROW 50004, 'Modul PR tidak memiliki setting approval aktif.', 1;
        END;

        IF ISNULL(@ApprovalMethodID, 0) = 0
        BEGIN
            THROW 50005, 'Approval method tidak valid untuk modul PR.', 1;
        END;

        SET @sql = N'

SELECT
@ExistingApprovalRequestID = ar.ApprovalRequestID
FROM ' + QUOTENAME(@InventoryAktif) + N'.dbo.TrApprovalRequest ar WITH (UPDLOCK, HOLDLOCK)
WHERE ar.SourceDbName = @SourceDbName
AND ar.SourceSchemaName = @SourceSchemaName
AND ar.SourceTableName = @SourceTableName
AND ar.TransactionID = @TransactionID;
';

        EXEC sp_executesql
            @sql,
            N'
                @SourceDbName SYSNAME,
                @SourceSchemaName SYSNAME,
                @SourceTableName SYSNAME,
                @TransactionID BIGINT,
                @ExistingApprovalRequestID BIGINT OUTPUT
            ',
            @SourceDbName = @SourceDbName,
            @SourceSchemaName = @SourceSchemaName,
            @SourceTableName = @SourceTableName,
            @TransactionID = @id_pr,
            @ExistingApprovalRequestID = @ExistingApprovalRequestID OUTPUT;

        IF @ExistingApprovalRequestID IS NOT NULL
        BEGIN
            THROW 50006, 'TRPR ini sudah pernah dibuatkan approval request.', 1;
        END;

        IF @ApprovalMethodID = 5
        BEGIN
            IF @TransactionAmount IS NULL
            BEGIN
                THROW 50007, 'TransactionAmount wajib diisi untuk approval based on amount.', 1;
            END;

            SET @sql = N'

SELECT TOP 1
@ApprovalAmountRuleID = aar.ApprovalAmountRuleID
FROM ' + QUOTENAME(@InventoryAktif) + N'.dbo.MsApprovalAmountRule aar
WHERE aar.ApprovalSettingID = @ApprovalSettingID
AND aar.IsActive = 1
AND @TransactionAmount >= aar.AmountFrom
AND (aar.AmountTo IS NULL OR @TransactionAmount <= aar.AmountTo)
ORDER BY aar.AmountFrom DESC;
';

            EXEC sp_executesql
                @sql,
                N'
                    @ApprovalSettingID BIGINT,
                    @TransactionAmount DECIMAL(19,4),
                    @ApprovalAmountRuleID BIGINT OUTPUT
                ',
                @ApprovalSettingID = @ApprovalSettingID,
                @TransactionAmount = @TransactionAmount,
                @ApprovalAmountRuleID = @ApprovalAmountRuleID OUTPUT;

            IF @ApprovalAmountRuleID IS NULL
            BEGIN
                THROW 50008, 'Rule amount approval tidak ditemukan untuk nilai PR ini.', 1;
            END;
        END;

        SET @sql = N'

INSERT INTO ' + QUOTENAME(@InventoryAktif) + N'.dbo.TrApprovalRequest
(
ApprovalSettingID,
id_form,
SourceDbName,
SourceSchemaName,
SourceTableName,
TransactionID,
TransactionNo,
TransactionDate,
TransactionAmount,
TransactionDescription,
ApprovalStatusID,
SubmittedBy,
SubmittedDate,
CreatedBy,
CreatedDate
)
VALUES
(
@ApprovalSettingID,
@id_form,
@SourceDbName,
@SourceSchemaName,
@SourceTableName,
@TransactionID,
@TransactionNo,
@TransactionDate,
@TransactionAmount,
@TransactionDescription,
@WaitingStatus,
@LoginUserID,
GETDATE(),
@UserName,
GETDATE()
);

SET @ApprovalRequestID = CONVERT(BIGINT, SCOPE_IDENTITY());

INSERT INTO ' + QUOTENAME(@InventoryAktif) + N'.dbo.TrApprovalRequestApprover
(
ApprovalRequestID,
ApproverUserID,
ApprovalLevel,
SequenceNo,
IsRequired,
ApprovalStatusID
)
SELECT
@ApprovalRequestID,
ma.UserID,
ma.ApprovalLevel,
ma.SequenceNo,
ma.IsRequired,
@WaitingStatus
FROM ' + QUOTENAME(@InventoryAktif) + N'.dbo.MsApprovalApprover ma
WHERE ma.ApprovalSettingID = @ApprovalSettingID
AND ma.IsActive = 1
AND (
ma.ApprovalAmountRuleID IS NULL
OR ma.ApprovalAmountRuleID = @ApprovalAmountRuleID
);

SET @ApproverCount = @@ROWCOUNT;
';

        EXEC sp_executesql
            @sql,
            N'
                @ApprovalSettingID BIGINT,
                @id_form BIGINT,
                @SourceDbName SYSNAME,
                @SourceSchemaName SYSNAME,
                @SourceTableName SYSNAME,
                @TransactionID BIGINT,
                @TransactionNo NVARCHAR(20),
                @TransactionDate DATE,
                @TransactionAmount DECIMAL(19,4),
                @TransactionDescription NVARCHAR(500),
                @WaitingStatus TINYINT,
                @LoginUserID BIGINT,
                @UserName NVARCHAR(50),
                @ApprovalAmountRuleID BIGINT,
                @ApprovalRequestID BIGINT OUTPUT,
                @ApproverCount INT OUTPUT
            ',
            @ApprovalSettingID = @ApprovalSettingID,
            @id_form = @id_form,
            @SourceDbName = @SourceDbName,
            @SourceSchemaName = @SourceSchemaName,
            @SourceTableName = @SourceTableName,
            @TransactionID = @id_pr,
            @TransactionNo = @prno,
            @TransactionDate = @prdate,
            @TransactionAmount = @TransactionAmount,
            @TransactionDescription = @note,
            @WaitingStatus = @WaitingStatus,
            @LoginUserID = @LoginUserID,
            @UserName = @UserName,
            @ApprovalAmountRuleID = @ApprovalAmountRuleID,
            @ApprovalRequestID = @ApprovalRequestID OUTPUT,
            @ApproverCount = @ApproverCount OUTPUT;

        IF ISNULL(@ApproverCount, 0) = 0
        BEGIN
            THROW 50009, 'Approver untuk modul PR belum disetting.', 1;
        END;

        UPDATE dbo.TRPR
        SET
            ApprovalRequestID = @ApprovalRequestID,
            ApprovalStatusID = @WaitingStatus,
            approve_status = N'WAITING_APPROVE',
            LastUpdatedBy = @UserName,
            LastUpdatedDate = GETDATE(),
            LastUpdatedFromModul = @FromModul
        WHERE id_pr = @id_pr
          AND ApprovalStatusID = @DraftStatus;

        IF @@ROWCOUNT = 0
        BEGIN
            THROW 50010, 'Gagal update status TRPR menjadi WAITING_APPROVE.', 1;
        END;

        COMMIT TRAN;

        SELECT
            @ApprovalRequestID AS ApprovalRequestID,
            @id_pr AS id_pr,
            @prno AS prno,
            @WaitingStatus AS ApprovalStatusID,
            N'WAITING_APPROVE' AS approve_status,
            @ApproverCount AS ApproverCount;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;

        THROW;
    END CATCH

END;
GO

================================================== 10. BACKEND API - ENDPOINT
==================================================

Buat endpoint minimal untuk TRPR:

1. GET /api/trpr/{idPr}
   Fungsi:
   - Ambil detail TRPR.
   - Return ApprovalStatusID, approve_status, ApprovalRequestID.

2. GET /api/trpr/approval-setting?idForm={id_form}
   Fungsi:
   - Call SP_Approval_GetModuleSetting.
   - Return apakah modul PR perlu approval.

3. POST /api/trpr/{idPr}/ready-to-approve
   Body:
   {
   "idForm": 123
   }

   Fungsi:
   - Ambil LoginUserID dari token/session.
   - Ambil UserName dari token/session.
   - Ambil InventoryAktif dari config.
   - Jika method based on amount, hitung total amount PR dari detail.
   - Call SP_TRPR_ReadyToApprove.
   - Return result.

================================================== 11. BACKEND DTO
==================================================

ReadyToApproveRequestDto:

public class ReadyToApproveRequestDto
{
public long IdForm { get; set; }
}

ReadyToApproveResultDto:

public class ReadyToApproveResultDto
{
public long ApprovalRequestID { get; set; }
public long Id_Pr { get; set; }
public string PrNo { get; set; }
public byte ApprovalStatusID { get; set; }
public string Approve_Status { get; set; }
public int ApproverCount { get; set; }
}

ApprovalModuleSettingDto:

public class ApprovalModuleSettingDto
{
public long ApprovalSettingID { get; set; }
public long Id_Form { get; set; }
public bool PerluApproval { get; set; }
public byte ApprovalMethodID { get; set; }
public string MethodCode { get; set; }
public string MethodName { get; set; }
public short? MinimalApproval { get; set; }
public bool IsActive { get; set; }
}

ApiResponseDto:

public class ApiResponseDto<T>
{
public bool Success { get; set; }
public string Message { get; set; }
public T Data { get; set; }
}

================================================== 12. BACKEND DAPPER CALL
==================================================

Contoh repository method untuk setting:

public async Task<ApprovalModuleSettingDto?> GetModuleSettingAsync(long idForm)
{
using var conn = \_dbConnectionFactory.CreateTransactionConnection();

    return await conn.QueryFirstOrDefaultAsync<ApprovalModuleSettingDto>(
        "dbo.SP_Approval_GetModuleSetting",
        new
        {
            id_form = idForm,
            InventoryAktif = _configuration["Approval:InventoryAktif"]
        },
        commandType: CommandType.StoredProcedure
    );

}

Contoh repository method Ready To Approve:

public async Task<ReadyToApproveResultDto> ReadyToApproveAsync(
long idPr,
long idForm,
long loginUserId,
string userName,
decimal? transactionAmount = null)
{
using var conn = \_dbConnectionFactory.CreateTransactionConnection();

    return await conn.QuerySingleAsync<ReadyToApproveResultDto>(
        "dbo.SP_TRPR_ReadyToApprove",
        new
        {
            id_pr = idPr,
            id_form = idForm,
            LoginUserID = loginUserId,
            UserName = userName,
            InventoryAktif = _configuration["Approval:InventoryAktif"],
            FromModul = "TRPR",
            TransactionAmount = transactionAmount
        },
        commandType: CommandType.StoredProcedure
    );

}

================================================== 13. BACKEND CONTROLLER CONCEPT
==================================================

[HttpGet("approval-setting")]
public async Task<IActionResult> GetApprovalSetting([FromQuery] long idForm)
{
var data = await \_trprService.GetModuleSettingAsync(idForm);

    return Ok(new ApiResponseDto<ApprovalModuleSettingDto?>
    {
        Success = true,
        Message = "OK",
        Data = data
    });

}

[HttpPost("{idPr:long}/ready-to-approve")]
public async Task<IActionResult> ReadyToApprove(
long idPr,
[FromBody] ReadyToApproveRequestDto request)
{
var loginUserId = GetLoginUserIdFromToken();
var userName = GetUserNameFromToken();

    var result = await _trprService.ReadyToApproveAsync(
        idPr,
        request.IdForm,
        loginUserId,
        userName
    );

    return Ok(new ApiResponseDto<ReadyToApproveResultDto>
    {
        Success = true,
        Message = "TRPR berhasil diajukan approval.",
        Data = result
    });

}

================================================== 14. FRONTEND UI FLOW
==================================================

Saat page TRPR load:

1. Fetch detail TRPR.
2. Fetch approval setting by idForm.
3. Tentukan apakah toolbar "Ready To Approve" muncul.

Pseudo logic:

const showReadyToApprove =
approvalSetting?.perluApproval === true &&
approvalSetting?.isActive === true &&
trpr?.approvalStatusID === 0 &&
!!trpr?.id_pr;

Jika showReadyToApprove true:

- Tampilkan button toolbar "Ready To Approve".

Jika false:

- Sembunyikan button.

Saat klik:

1. Tampilkan confirmation modal:
   "Apakah Anda yakin ingin mengajukan PR ini ke approval?"
2. Jika confirm, call:
   POST /api/trpr/{idPr}/ready-to-approve
3. Jika success:
   - toast success
   - reload detail TRPR
   - status menjadi WAITING_APPROVE
   - tombol hilang
4. Jika error:
   - toast error dari response backend

================================================== 15. FRONTEND CONSTANT STATUS
==================================================

export const APPROVAL_STATUS = {
DRAFT: "DRAFT",
WAITING_APPROVE: "WAITING_APPROVE",
APPROVE: "APPROVE",
REJECT: "REJECT",
} as const;

export const APPROVAL_STATUS_ID = {
DRAFT: 0,
WAITING_APPROVE: 1,
APPROVE: 2,
REJECT: 3,
} as const;

const approvalBadge = {
DRAFT: {
label: "Draft",
color: "gray",
},
WAITING_APPROVE: {
label: "Waiting Approve",
color: "warning",
},
APPROVE: {
label: "Approve",
color: "success",
},
REJECT: {
label: "Reject",
color: "danger",
},
};

================================================== 16. DASHBOARD APPROVAL IMPACT
==================================================

Setelah SP_TRPR_ReadyToApprove berhasil:

- Ada row baru di [InventoryAktif].dbo.TrApprovalRequest.
- Ada row baru di [InventoryAktif].dbo.TrApprovalRequestApprover.
- TRPR berubah menjadi WAITING_APPROVE.
- Dashboard approval akan menampilkan data berdasarkan user approver login.

Dashboard query harus filter:

- TrApprovalRequest.ApprovalStatusID = 1
- TrApprovalRequestApprover.ApprovalStatusID = 1
- TrApprovalRequestApprover.ApproverUserID = LoginUserID

Untuk approval sequential:

- Hanya tampil jika level sebelumnya sudah tidak WAITING_APPROVE.

Query konsep dashboard:

SELECT
ar.ApprovalRequestID,
ara.ApprovalRequestApproverID,
ar.ApprovalSettingID,
ar.id_form,
f.FormName,
ar.SourceDbName,
ar.SourceSchemaName,
ar.SourceTableName,
ar.TransactionID,
ar.TransactionNo,
ar.TransactionDate,
ar.TransactionAmount,
ar.TransactionDescription,
ar.SubmittedBy,
ar.SubmittedDate,
ara.ApproverUserID,
ara.ApprovalLevel,
ara.SequenceNo,
st.StatusCode,
st.StatusName
FROM [InventoryAktif].dbo.TrApprovalRequestApprover ara
INNER JOIN [InventoryAktif].dbo.TrApprovalRequest ar
ON ar.ApprovalRequestID = ara.ApprovalRequestID
INNER JOIN [InventoryAktif].dbo.MsApprovalModuleSetting ams
ON ams.ApprovalSettingID = ar.ApprovalSettingID
INNER JOIN [InventoryAktif].dbo.MsForm f
ON f.id_form = ar.id_form
INNER JOIN [InventoryAktif].dbo.MsApprovalStatus st
ON st.ApprovalStatusID = ara.ApprovalStatusID
WHERE
ara.ApproverUserID = @LoginUserID
AND ara.ApprovalStatusID = 1
AND ar.ApprovalStatusID = 1
AND (
ams.ApprovalMethodID <> 4
OR NOT EXISTS (
SELECT 1
FROM [InventoryAktif].dbo.TrApprovalRequestApprover prev
WHERE prev.ApprovalRequestID = ara.ApprovalRequestID
AND prev.ApprovalLevel < ara.ApprovalLevel
AND prev.ApprovalStatusID = 1
)
)
ORDER BY
ar.SubmittedDate DESC,
ara.ApprovalLevel,
ara.SequenceNo;

================================================== 17. APPROVE / REJECT FINAL IMPACT KE TRPR
==================================================

Saat approver approve/reject dari Dashboard Approval:

A. Approve:

- Update TrApprovalRequestApprover menjadi APPROVE.
- Insert TrApprovalRequestActionLog.
- Jika approval sudah final:
  - Update TrApprovalRequest menjadi APPROVE.
  - Update transaksi asal:
    [SourceDbName].dbo.TRPR
    SET ApprovalStatusID = 2,
    approve_status = 'APPROVE',
    LastUpdatedBy = @UserName,
    LastUpdatedDate = GETDATE()
    WHERE id_pr = @TransactionID

B. Reject:

- Update TrApprovalRequestApprover menjadi REJECT.
- Insert TrApprovalRequestActionLog.
- Update TrApprovalRequest menjadi REJECT.
- Update transaksi asal:
  [SourceDbName].dbo.TRPR
  SET ApprovalStatusID = 3,
  approve_status = 'REJECT',
  LastUpdatedBy = @UserName,
  LastUpdatedDate = GETDATE()
  WHERE id_pr = @TransactionID

Security:

- Update transaksi asal harus pakai SourceDbName, SourceSchemaName, SourceTableName dari TrApprovalRequest.
- Jangan terima nama table dari frontend.
- Gunakan whitelist form/module:
  id_form PR -> dbo.TRPR -> key id_pr.
- Gunakan QUOTENAME untuk database/schema/table.
- Gunakan sp_executesql untuk parameter value.

================================================== 18. SECURITY RULES
==================================================

Wajib:

- UserID harus dari token/session, bukan dari frontend.
- Ready To Approve hanya boleh dari status DRAFT.
- Jangan izinkan double submit approval.
- Jangan insert approval request jika approver belum disetting.
- Jangan insert approval request jika setting approval tidak aktif.
- Dynamic SQL hanya untuk nama database approval pusat dan harus memakai QUOTENAME.
- Value seperti id_pr, id_form, UserID, amount harus tetap parameter sp_executesql.
- Semua proses Ready To Approve harus dalam transaction.
- Gunakan SET XACT_ABORT ON.
- Jika error, rollback.
- Jangan foreign key lintas database.

================================================== 19. ERROR MESSAGE WAJIB
==================================================

Gunakan pesan error berikut:

- "Database approval pusat tidak ditemukan."
- "Data TRPR tidak ditemukan."
- "TRPR hanya bisa Ready To Approve dari status DRAFT."
- "Modul PR tidak memiliki setting approval aktif."
- "Approval method tidak valid untuk modul PR."
- "TRPR ini sudah pernah dibuatkan approval request."
- "TransactionAmount wajib diisi untuk approval based on amount."
- "Rule amount approval tidak ditemukan untuk nilai PR ini."
- "Approver untuk modul PR belum disetting."
- "Gagal update status TRPR menjadi WAITING_APPROVE."

================================================== 20. APPSETTINGS
==================================================

Contoh DEV:

{
"ConnectionStrings": {
"TransactionDb": "Server=.;Database=GK2026IN;Trusted_Connection=True;TrustServerCertificate=True;"
},
"Approval": {
"InventoryAktif": "InventoryTES"
}
}

Contoh PROD:

{
"ConnectionStrings": {
"TransactionDb": "Server=.;Database=GK2026IN;User Id=xxx;Password=xxx;TrustServerCertificate=True;"
},
"Approval": {
"InventoryAktif": "InventoryERP"
}
}

================================================== 21. OUTPUT YANG HARUS DIBUAT OLEH AI AGENT
==================================================

AI Agent harus menghasilkan:

A. SQL migration/script

- Tambah ApprovalRequestID di TRPR.
- Tambah unique index id_pr.
- Tambah default ApprovalStatusID = 0.
- Tambah default approve_status = 'DRAFT'.
- Buat SP_Approval_GetModuleSetting.
- Buat SP_TRPR_ReadyToApprove.

B. Backend ASP.NET Core + Dapper

- DTO request/response.
- Repository method:
  - GetModuleSettingAsync
  - ReadyToApproveAsync
- Service method:
  - GetModuleSettingAsync
  - ReadyToApproveAsync
- Controller endpoint:
  - GET /api/trpr/approval-setting
  - POST /api/trpr/{idPr}/ready-to-approve
- Error handling.
- Response ApiResponseDto.
- UserID dan UserName dari token/session.

C. Frontend page TRPR

- Load approval setting saat page load.
- Tampilkan toolbar button Ready To Approve jika rule terpenuhi.
- Confirmation modal saat klik.
- API call ready to approve.
- Refresh data setelah sukses.
- Tampilkan badge status approval.
- Disable button saat loading.
- Tampilkan toast success/error.

D. Integrasi Dashboard Approval

- Pastikan row WAITING_APPROVE muncul karena SP sudah insert:
  - TrApprovalRequest
  - TrApprovalRequestApprover
- Dashboard tetap baca database approval pusat.
- Dashboard filter berdasarkan ApproverUserID login.

================================================== 22. ACCEPTANCE CRITERIA
==================================================

Implementasi dianggap selesai jika:

1. Create TRPR menghasilkan:
   ApprovalStatusID = 0
   approve_status = 'DRAFT'

2. Tombol Ready To Approve:
   - Muncul jika setting PR perlu approval aktif.
   - Tidak muncul jika setting tidak aktif.
   - Tidak muncul jika status bukan DRAFT.

3. Klik Ready To Approve:
   - Insert TrApprovalRequest di database approval pusat.
   - Insert TrApprovalRequestApprover di database approval pusat.
   - Update TRPR menjadi:
     ApprovalStatusID = 1
     approve_status = 'WAITING_APPROVE'
     ApprovalRequestID terisi.

4. Data muncul di Dashboard Approval untuk approver yang benar.

5. Double submit tidak bisa.

6. Jika approver belum disetting, proses rollback dan TRPR tetap DRAFT.

7. Jika setting approval tidak aktif, proses ditolak.

8. Sistem tetap menggunakan 1 koneksi aplikasi ke database transaksi saat memanggil SP.

9. SP mengakses database approval pusat memakai:
   QUOTENAME(@InventoryAktif) + '.dbo.NamaTabel'

10. Tidak ada foreign key lintas database.

================================================== 23. CATATAN IMPLEMENTASI FINAL
==================================================

Konsep final:

- TRPR adalah transaksi sumber.
- id_pr dipakai sebagai TransactionID.
- prno dipakai sebagai TransactionNo.
- prdate dipakai sebagai TransactionDate.
- note dipakai sebagai TransactionDescription.
- TransactionAmount optional, wajib hanya jika method BASED_ON_AMOUNT.
- id_form membuat SP reusable untuk multi modul.
- InventoryAktif membuat SP fleksibel DEV/PROD.
- Dashboard Approval tidak membaca TRPR langsung.
- Dashboard Approval hanya membaca TrApprovalRequest dan TrApprovalRequestApprover di database approval pusat.
