$ErrorActionPreference = "Stop"
$serviceName = 'pwa'
$logPath = 'D:\KANTOR\Project VB\WEB DOA\.codex-tmp\f5\pwa.log'
$logDirectory = Split-Path -Parent $logPath
if (-not [string]::IsNullOrWhiteSpace($logDirectory)) {
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
}
Set-Content -LiteralPath $logPath -Value "" -Encoding UTF8
Set-Location -LiteralPath 'D:\KANTOR\Project VB\WEB DOA\doa_donatur_pwa'
$env:VITE_API_BASE_URL = 'http://127.0.0.1:5178'
$command = 'npm.cmd'
$arguments = @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5174', '--strictPort')

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
