using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;

namespace API.Service;

public sealed class ProjectDatabaseVersionService
{
    private const string DefaultProjectCode = "WEB_DOA";
    private const int DefaultCommandTimeoutSeconds = 120;
    private const int BootstrapLockTimeoutMilliseconds = 60000;
    private static readonly Regex GoBatchSeparatorRegex = new(
        @"(?im)^\s*GO(?:\s+\d+)?\s*$",
        RegexOptions.Compiled);
    private static readonly Regex StepFileNameRegex = new(
        @"^(?<version>\d{10})__(?<description>.+)\.sql$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly IConfiguration configuration;
    private readonly ILogger<ProjectDatabaseVersionService> logger;
    private readonly DatabaseVersioningReadiness readiness;

    public ProjectDatabaseVersionService(
        IConfiguration configuration,
        ILogger<ProjectDatabaseVersionService> logger,
        DatabaseVersioningReadiness readiness)
    {
        this.configuration = configuration;
        this.logger = logger;
        this.readiness = readiness;
    }

    public async Task EnsureDatabaseUpToDateAsync(
        string? updatedBy,
        CancellationToken cancellationToken = default)
    {
        if (!readiness.IsVersioningEnabled)
        {
            readiness.MarkReady();
            return;
        }

        var sourceDefinitions = LoadSourceDefinitions();
        var targetVersion = sourceDefinitions.Count == 0
            ? 0L
            : sourceDefinitions.Max(step => step.VersionNo);
        var projectCode = ResolveProjectCode();
        var normalizedUpdatedBy = NormalizeUpdatedBy(updatedBy);

        await using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var bootstrapLockAcquired = false;
        Exception? protectedOperationException = null;
        try
        {
            await AcquireBootstrapLockAsync(connection, projectCode);
            bootstrapLockAcquired = true;
            cancellationToken.ThrowIfCancellationRequested();

            await EnsureControlObjectsAsync(connection, cancellationToken);

            var currentVersion = await GetCurrentVersionAsync(connection, projectCode, cancellationToken);
            await LogHistoricalDefinitionWarningsAsync(
                connection,
                projectCode,
                currentVersion,
                sourceDefinitions,
                cancellationToken);
            await SyncDefinitionsAsync(connection, projectCode, sourceDefinitions, cancellationToken);

            if (currentVersion > targetVersion)
            {
                logger.LogWarning(
                    "Database sudah berada di versi {CurrentVersion}, lebih tinggi dari target WEB DOA {TargetVersion}. Update otomatis dilewati.",
                    currentVersion,
                    targetVersion);
                readiness.MarkReady();
                return;
            }

            if (currentVersion == targetVersion)
            {
                logger.LogInformation("Database WEB DOA sudah sesuai target version {TargetVersion}.", targetVersion);
                readiness.MarkReady();
                return;
            }

            logger.LogInformation(
                "Menjalankan update database WEB DOA untuk project {ProjectCode} dari {CurrentVersion} ke {TargetVersion}.",
                projectCode,
                currentVersion,
                targetVersion);

            try
            {
                await connection.ExecuteAsync(new CommandDefinition(
                    "EXEC dbo.UpdateDatabase @ProjectCode, @TargetVersion, @UpdatedBy",
                    new
                    {
                        ProjectCode = projectCode,
                        TargetVersion = targetVersion,
                        UpdatedBy = normalizedUpdatedBy
                    },
                    commandTimeout: GetCommandTimeoutSeconds(),
                    cancellationToken: cancellationToken));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                var failedStep = await TryResolveFailedStepAsync(
                    connection,
                    projectCode,
                    sourceDefinitions,
                    cancellationToken);

                if (failedStep is null)
                {
                    throw;
                }

                logger.LogError(
                    ex,
                    "Auto update database {DatabaseName} gagal saat menjalankan versi {VersionNo} ({FileName}).",
                    connection.Database,
                    failedStep.VersionNo,
                    failedStep.FileName);
                throw new InvalidOperationException(
                    $"Auto update database {connection.Database} gagal saat menjalankan versi {failedStep.VersionNo} ({failedStep.FileName}).",
                    ex);
            }

            var finalVersion = await GetCurrentVersionAsync(connection, projectCode, cancellationToken);
            if (finalVersion < targetVersion)
            {
                throw new InvalidOperationException(
                    $"Auto update database WEB DOA tidak mencapai target version {targetVersion}. Versi terakhir yang tersimpan: {finalVersion}.");
            }

            readiness.MarkReady();
        }
        catch (Exception ex)
        {
            protectedOperationException = ex;
            throw;
        }
        finally
        {
            if (bootstrapLockAcquired)
            {
                try
                {
                    await ReleaseBootstrapLockAsync(connection, projectCode);
                }
                catch (Exception releaseException) when (protectedOperationException is not null)
                {
                    logger.LogError(
                        releaseException,
                        "Gagal melepas lock bootstrap database untuk project {ProjectCode}; error update sebelumnya tetap dipertahankan.",
                        projectCode);
                }
            }
        }
    }

    private async Task AcquireBootstrapLockAsync(
        SqlConnection connection,
        string projectCode)
    {
        const string sql = @"
DECLARE @LockResult INT;
EXEC @LockResult = sp_getapplock
    @Resource = @LockResource,
    @LockMode = 'Exclusive',
    @LockOwner = 'Session',
    @LockTimeout = @LockTimeoutMilliseconds;
SELECT @LockResult;";

        var lockResult = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new
            {
                LockResource = BuildLockResource(projectCode),
                LockTimeoutMilliseconds = BootstrapLockTimeoutMilliseconds
            },
            commandTimeout: GetCommandTimeoutSeconds(),
            cancellationToken: CancellationToken.None));

        if (lockResult < 0)
        {
            throw new InvalidOperationException(
                $"Gagal mendapatkan lock bootstrap update database untuk project {projectCode}. Hasil sp_getapplock: {lockResult}.");
        }
    }

    private async Task ReleaseBootstrapLockAsync(SqlConnection connection, string projectCode)
    {
        const string sql = @"
DECLARE @ReleaseResult INT;
EXEC @ReleaseResult = sp_releaseapplock
    @Resource = @LockResource,
    @LockOwner = 'Session';
SELECT @ReleaseResult;";

        var releaseResult = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql,
            new { LockResource = BuildLockResource(projectCode) },
            commandTimeout: GetCommandTimeoutSeconds(),
            cancellationToken: CancellationToken.None));

        if (releaseResult < 0)
        {
            throw new InvalidOperationException(
                $"Gagal melepas lock bootstrap update database untuk project {projectCode}. Hasil sp_releaseapplock: {releaseResult}.");
        }
    }

    private async Task EnsureControlObjectsAsync(SqlConnection connection, CancellationToken cancellationToken)
    {
        await connection.ExecuteAsync(new CommandDefinition(
            BuildControlTablesSql(),
            commandTimeout: GetCommandTimeoutSeconds(),
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            BuildUpdateDatabaseProcedureSql(),
            commandTimeout: GetCommandTimeoutSeconds(),
            cancellationToken: cancellationToken));
    }

    private async Task<long> GetCurrentVersionAsync(
        SqlConnection connection,
        string projectCode,
        CancellationToken cancellationToken)
    {
        var currentVersion = await connection.ExecuteScalarAsync<long?>(new CommandDefinition(
            @"SELECT CurrentVersion
              FROM dbo.ProjectDbVersion
              WHERE ProjectCode = @ProjectCode",
            new { ProjectCode = projectCode },
            commandTimeout: GetCommandTimeoutSeconds(),
            cancellationToken: cancellationToken));
        return currentVersion ?? 0L;
    }

    private async Task<DatabaseUpdateStep?> TryResolveFailedStepAsync(
        SqlConnection connection,
        string projectCode,
        IReadOnlyList<DatabaseUpdateStep> sourceDefinitions,
        CancellationToken cancellationToken)
    {
        var currentVersion = await GetCurrentVersionAsync(connection, projectCode, cancellationToken);
        return sourceDefinitions
            .Where(step => step.VersionNo > currentVersion)
            .OrderBy(step => step.VersionNo)
            .FirstOrDefault();
    }

    private async Task LogHistoricalDefinitionWarningsAsync(
        SqlConnection connection,
        string projectCode,
        long currentVersion,
        IReadOnlyList<DatabaseUpdateStep> sourceDefinitions,
        CancellationToken cancellationToken)
    {
        if (currentVersion <= 0 || sourceDefinitions.Count == 0)
        {
            return;
        }

        var storedDefinitions = (await connection.QueryAsync<StoredDatabaseUpdateDefinition>(new CommandDefinition(
            @"SELECT VersionNo, [Checksum]
              FROM dbo.ProjectDbUpdateDefinition
              WHERE ProjectCode = @ProjectCode
                AND VersionNo <= @CurrentVersion",
            new { ProjectCode = projectCode, CurrentVersion = currentVersion },
            commandTimeout: GetCommandTimeoutSeconds(),
            cancellationToken: cancellationToken)))
            .ToDictionary(item => item.VersionNo);

        var missingVersions = new List<long>();
        var mismatchedVersions = new List<string>();
        foreach (var step in sourceDefinitions.Where(step => step.VersionNo <= currentVersion))
        {
            if (!storedDefinitions.TryGetValue(step.VersionNo, out var storedDefinition))
            {
                missingVersions.Add(step.VersionNo);
            }
            else if (!string.Equals(
                         NormalizeChecksum(storedDefinition.Checksum),
                         NormalizeChecksum(step.Checksum),
                         StringComparison.OrdinalIgnoreCase))
            {
                mismatchedVersions.Add(step.VersionNo.ToString());
            }
        }

        if (missingVersions.Count > 0)
        {
            logger.LogWarning(
                "Version-only mode melewati definisi historis yang hilang untuk WEB DOA. Missing versions: {MissingVersions}.",
                string.Join(", ", missingVersions));
        }

        if (mismatchedVersions.Count > 0)
        {
            logger.LogWarning(
                "Version-only mode melewati drift checksum historis WEB DOA. Drift versions: {MismatchedVersions}.",
                string.Join(", ", mismatchedVersions));
        }
    }

    private async Task SyncDefinitionsAsync(
        SqlConnection connection,
        string projectCode,
        IReadOnlyList<DatabaseUpdateStep> sourceDefinitions,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF EXISTS (
    SELECT 1
    FROM dbo.ProjectDbUpdateDefinition
    WHERE ProjectCode = @ProjectCode
      AND VersionNo = @VersionNo
)
BEGIN
    UPDATE dbo.ProjectDbUpdateDefinition
    SET [Description] = @Description,
        SqlBody = @SqlBody,
        [Checksum] = @Checksum,
        IsActive = 1,
        LastUpdatedAt = SYSUTCDATETIME()
    WHERE ProjectCode = @ProjectCode
      AND VersionNo = @VersionNo;
END
ELSE
BEGIN
    INSERT INTO dbo.ProjectDbUpdateDefinition
    (
        ProjectCode, VersionNo, [Description], SqlBody, [Checksum], IsActive, CreatedAt, LastUpdatedAt
    )
    VALUES
    (
        @ProjectCode, @VersionNo, @Description, @SqlBody, @Checksum, 1, SYSUTCDATETIME(), SYSUTCDATETIME()
    );
END;";

        foreach (var step in sourceDefinitions)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    ProjectCode = projectCode,
                    step.VersionNo,
                    step.Description,
                    step.SqlBody,
                    step.Checksum
                },
                commandTimeout: GetCommandTimeoutSeconds(),
                cancellationToken: cancellationToken));
        }
    }

    private List<DatabaseUpdateStep> LoadSourceDefinitions()
    {
        var directoryPath = Path.Combine(AppContext.BaseDirectory, "DatabaseVersioning", "Main");
        if (!Directory.Exists(directoryPath))
        {
            throw new InvalidOperationException($"Directory versioning database tidak ditemukan: {directoryPath}");
        }

        var steps = new List<DatabaseUpdateStep>();
        foreach (var filePath in Directory
                     .EnumerateFiles(directoryPath, "*.sql", SearchOption.TopDirectoryOnly)
                     .OrderBy(path => path, StringComparer.OrdinalIgnoreCase))
        {
            var fileName = Path.GetFileName(filePath);
            var match = StepFileNameRegex.Match(fileName);
            if (!match.Success)
            {
                throw new InvalidOperationException(
                    $"Nama file versioning database tidak valid: {fileName}. Format wajib yyyyMMddNN__description.sql.");
            }

            var sqlBody = File.ReadAllText(filePath, Encoding.UTF8)
                .TrimStart('\uFEFF')
                .Replace("\r\n", "\n", StringComparison.Ordinal)
                .Replace("\r", "\n", StringComparison.Ordinal);
            if (GoBatchSeparatorRegex.IsMatch(sqlBody))
            {
                throw new InvalidOperationException(
                    $"File versioning {fileName} mengandung batch separator GO. Runtime updater hanya menerima single-batch SQL.");
            }

            steps.Add(new DatabaseUpdateStep(
                long.Parse(match.Groups["version"].Value, System.Globalization.CultureInfo.InvariantCulture),
                NormalizeDescription(match.Groups["description"].Value),
                sqlBody,
                ComputeChecksum(sqlBody),
                fileName));
        }

        var duplicateVersion = steps.GroupBy(step => step.VersionNo).FirstOrDefault(group => group.Count() > 1);
        if (duplicateVersion is not null)
        {
            throw new InvalidOperationException(
                $"Duplikasi version number ditemukan pada katalog database versioning: {duplicateVersion.Key}.");
        }

        return steps.OrderBy(step => step.VersionNo).ToList();
    }

    private SqlConnection CreateConnection()
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection belum diisi.");
        }

        return new SqlConnection(connectionString);
    }

    private string ResolveProjectCode()
    {
        return (configuration["DatabaseVersioning:ProjectCode"] ?? DefaultProjectCode).Trim().ToUpperInvariant();
    }

    private static string BuildLockResource(string projectCode) => $"ProjectDbUpdate:{projectCode}";

    private int GetCommandTimeoutSeconds()
    {
        var configuredValue = configuration.GetValue<int?>("DatabaseVersioning:CommandTimeoutSeconds");
        return configuredValue.GetValueOrDefault(DefaultCommandTimeoutSeconds) > 0
            ? configuredValue.GetValueOrDefault(DefaultCommandTimeoutSeconds)
            : DefaultCommandTimeoutSeconds;
    }

    private static string NormalizeDescription(string value)
    {
        return Regex.Replace(value.Replace('-', ' ').Replace('_', ' ').Trim(), @"\s+", " ").Trim();
    }

    private static string NormalizeChecksum(string? value) => (value ?? string.Empty).Trim().ToUpperInvariant();

    private static string ComputeChecksum(string sqlBody) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sqlBody)));

    private static string NormalizeUpdatedBy(string? updatedBy)
    {
        var normalized = (updatedBy ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(normalized) ? "LOGIN" : normalized;
    }

    private static string BuildControlTablesSql() => @"
SET NOCOUNT ON;

IF OBJECT_ID('dbo.ProjectDbVersion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectDbVersion
    (
        ProjectCode NVARCHAR(100) NOT NULL,
        CurrentVersion BIGINT NOT NULL CONSTRAINT DF_ProjectDbVersion_CurrentVersion DEFAULT (0),
        LastUpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectDbVersion_LastUpdatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedBy NVARCHAR(100) NOT NULL CONSTRAINT DF_ProjectDbVersion_UpdatedBy DEFAULT ('SYSTEM'),
        CONSTRAINT PK_ProjectDbVersion PRIMARY KEY CLUSTERED (ProjectCode ASC)
    );
END;

IF OBJECT_ID('dbo.ProjectDbUpdateDefinition', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectDbUpdateDefinition
    (
        ProjectCode NVARCHAR(100) NOT NULL,
        VersionNo BIGINT NOT NULL,
        [Description] NVARCHAR(255) NOT NULL CONSTRAINT DF_ProjectDbUpdateDefinition_Description DEFAULT (''),
        SqlBody NVARCHAR(MAX) NOT NULL CONSTRAINT DF_ProjectDbUpdateDefinition_SqlBody DEFAULT (''),
        [Checksum] NVARCHAR(64) NOT NULL CONSTRAINT DF_ProjectDbUpdateDefinition_Checksum DEFAULT (''),
        IsActive BIT NOT NULL CONSTRAINT DF_ProjectDbUpdateDefinition_IsActive DEFAULT (1),
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectDbUpdateDefinition_CreatedAt DEFAULT (SYSUTCDATETIME()),
        LastUpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectDbUpdateDefinition_LastUpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_ProjectDbUpdateDefinition PRIMARY KEY CLUSTERED (ProjectCode ASC, VersionNo ASC)
    );
END;

IF OBJECT_ID('dbo.ProjectDbUpdateLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectDbUpdateLog
    (
        Id BIGINT IDENTITY(1,1) NOT NULL,
        ProjectCode NVARCHAR(100) NOT NULL,
        FromVersion BIGINT NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_FromVersion DEFAULT (0),
        ExecutedVersion BIGINT NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_ExecutedVersion DEFAULT (0),
        TargetVersion BIGINT NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_TargetVersion DEFAULT (0),
        [Description] NVARCHAR(255) NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_Description DEFAULT (''),
        [Checksum] NVARCHAR(64) NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_Checksum DEFAULT (''),
        [Status] NVARCHAR(30) NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_Status DEFAULT ('RUNNING'),
        StartedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_StartedAt DEFAULT (SYSUTCDATETIME()),
        FinishedAt DATETIME2(0) NULL,
        [Message] NVARCHAR(4000) NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_Message DEFAULT (''),
        UpdatedBy NVARCHAR(100) NOT NULL CONSTRAINT DF_ProjectDbUpdateLog_UpdatedBy DEFAULT ('SYSTEM'),
        CONSTRAINT PK_ProjectDbUpdateLog PRIMARY KEY CLUSTERED (Id ASC)
    );

    CREATE NONCLUSTERED INDEX IX_ProjectDbUpdateLog_ProjectCode_ExecutedVersion
        ON dbo.ProjectDbUpdateLog (ProjectCode ASC, ExecutedVersion ASC, StartedAt DESC);
END;";

    private static string BuildUpdateDatabaseProcedureSql() => @"
IF OBJECT_ID('dbo.UpdateDatabase', 'P') IS NULL
BEGIN
    EXEC(N'
        CREATE PROCEDURE dbo.UpdateDatabase
        AS
        BEGIN
            SET NOCOUNT ON;
        END;');
END;

EXEC(N'
ALTER PROCEDURE dbo.UpdateDatabase
    @ProjectCode NVARCHAR(100),
    @TargetVersion BIGINT,
    @UpdatedBy NVARCHAR(100) = N''SYSTEM''
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISNULL(LTRIM(RTRIM(@ProjectCode)), N'''') = N''''
    BEGIN
        THROW 51090, ''ProjectCode wajib diisi.'', 1;
    END;

    DECLARE @NormalizedUpdatedBy NVARCHAR(100) = LEFT(ISNULL(NULLIF(LTRIM(RTRIM(@UpdatedBy)), N''''), N''SYSTEM''), 100);
    DECLARE @LockName NVARCHAR(200) = CONCAT(N''ProjectDbUpdate:'', @ProjectCode);
    DECLARE @LockResult INT;

    EXEC @LockResult = sp_getapplock
        @Resource = @LockName,
        @LockMode = ''Exclusive'',
        @LockOwner = ''Session'',
        @LockTimeout = 60000;

    IF @LockResult < 0
    BEGIN
        THROW 51091, ''Gagal mendapatkan lock update database.'', 1;
    END;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.ProjectDbVersion WHERE ProjectCode = @ProjectCode)
        BEGIN
            INSERT INTO dbo.ProjectDbVersion (ProjectCode, CurrentVersion, LastUpdatedAt, UpdatedBy)
            VALUES (@ProjectCode, 0, SYSUTCDATETIME(), @NormalizedUpdatedBy);
        END;

        DECLARE @CurrentVersion BIGINT = ISNULL((SELECT CurrentVersion FROM dbo.ProjectDbVersion WHERE ProjectCode = @ProjectCode), 0);
        DECLARE @NextVersion BIGINT;
        DECLARE @SqlBody NVARCHAR(MAX);
        DECLARE @Description NVARCHAR(255);
        DECLARE @Checksum NVARCHAR(64);
        DECLARE @LogId BIGINT;

        WHILE 1 = 1
        BEGIN
            SET @NextVersion = NULL;
            SET @SqlBody = NULL;
            SET @Description = NULL;
            SET @Checksum = NULL;

            SELECT TOP 1
                @NextVersion = VersionNo,
                @SqlBody = SqlBody,
                @Description = [Description],
                @Checksum = [Checksum]
            FROM dbo.ProjectDbUpdateDefinition
            WHERE ProjectCode = @ProjectCode
              AND IsActive = 1
              AND VersionNo > @CurrentVersion
              AND VersionNo <= @TargetVersion
            ORDER BY VersionNo ASC;

            IF @NextVersion IS NULL BREAK;

            INSERT INTO dbo.ProjectDbUpdateLog
            (ProjectCode, FromVersion, ExecutedVersion, TargetVersion, [Description], [Checksum], [Status], StartedAt, FinishedAt, [Message], UpdatedBy)
            VALUES
            (@ProjectCode, @CurrentVersion, @NextVersion, @TargetVersion, ISNULL(@Description, N''''), ISNULL(@Checksum, N''''), N''RUNNING'', SYSUTCDATETIME(), NULL, N'''', @NormalizedUpdatedBy);
            SET @LogId = SCOPE_IDENTITY();

            BEGIN TRY
                BEGIN TRAN;
                EXEC sp_executesql @SqlBody;
                UPDATE dbo.ProjectDbVersion
                SET CurrentVersion = @NextVersion,
                    LastUpdatedAt = SYSUTCDATETIME(),
                    UpdatedBy = @NormalizedUpdatedBy
                WHERE ProjectCode = @ProjectCode;
                COMMIT TRAN;

                UPDATE dbo.ProjectDbUpdateLog
                SET [Status] = N''SUCCESS'', FinishedAt = SYSUTCDATETIME(), [Message] = N''OK''
                WHERE Id = @LogId;
                SET @CurrentVersion = @NextVersion;
            END TRY
            BEGIN CATCH
                IF XACT_STATE() <> 0 ROLLBACK TRAN;

                UPDATE dbo.ProjectDbUpdateLog
                SET [Status] = N''FAILED'',
                    FinishedAt = SYSUTCDATETIME(),
                    [Message] = LEFT(ISNULL(ERROR_MESSAGE(), N''Unknown error''), 4000)
                WHERE Id = @LogId;
                THROW;
            END CATCH;
        END;

        EXEC sp_releaseapplock @Resource = @LockName, @LockOwner = ''Session'';
    END TRY
    BEGIN CATCH
        EXEC sp_releaseapplock @Resource = @LockName, @LockOwner = ''Session'';
        THROW;
    END CATCH;
END;');";

    private sealed record DatabaseUpdateStep(
        long VersionNo,
        string Description,
        string SqlBody,
        string Checksum,
        string FileName);

    private sealed class StoredDatabaseUpdateDefinition
    {
        public long VersionNo { get; init; }
        public string Checksum { get; init; } = string.Empty;
    }
}
