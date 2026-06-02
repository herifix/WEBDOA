$ErrorActionPreference = "Stop"
$serviceName = 'api'
$logPath = 'D:\KANTOR\Project VB\WEB DOA\.codex-tmp\f5\api.log'
$logDirectory = Split-Path -Parent $logPath
if (-not [string]::IsNullOrWhiteSpace($logDirectory)) {
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
}
Set-Content -LiteralPath $logPath -Value "" -Encoding UTF8
Set-Location -LiteralPath 'D:\KANTOR\Project VB\WEB DOA'
$env:DOTNET_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://127.0.0.1:5178'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$command = 'dotnet'
$arguments = @('run', '--project', 'API/API.csproj', '--no-launch-profile', '--urls', 'http://127.0.0.1:5178')

function Write-ServiceOutput {
    param([object] $Value)

    $line = if ($null -eq $Value) { "" } else { [string] $Value }
    $text = "[$serviceName] $line"
    Write-Host $text
    Add-Content -LiteralPath $logPath -Value $text -Encoding UTF8
}

try {
    & $command @arguments 2>&1 | ForEach-Object {
        Write-ServiceOutput $_
    }

    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) {
        $exitCode = 0
    }

    exit $exitCode
}
catch {
    Write-ServiceOutput $_.Exception.Message
    exit 1
}
