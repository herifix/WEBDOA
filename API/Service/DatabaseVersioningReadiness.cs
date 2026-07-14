namespace API.Service;

public sealed class DatabaseVersioningReadiness
{
    private int isReady;

    public DatabaseVersioningReadiness(IConfiguration configuration, IHostEnvironment hostEnvironment)
    {
        IsVersioningEnabled = ResolveEnabled(configuration);

        if (!IsVersioningEnabled && !hostEnvironment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Database versioning cannot be disabled outside the Development environment. " +
                "Remove DatabaseVersioning:Enabled=false or use Development only for local diagnostics.");
        }

        isReady = IsVersioningEnabled ? 0 : 1;
    }

    public bool IsVersioningEnabled { get; }

    public bool IsReady => Volatile.Read(ref isReady) == 1;

    public void MarkReady()
    {
        Interlocked.Exchange(ref isReady, 1);
    }

    private static bool ResolveEnabled(IConfiguration configuration)
    {
        var configuredValue = configuration["DatabaseVersioning:Enabled"];
        return string.IsNullOrWhiteSpace(configuredValue) ||
               !bool.TryParse(configuredValue, out var enabled) ||
               enabled;
    }
}
