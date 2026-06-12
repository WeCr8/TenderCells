# .claude/hooks/pre-tool-check.ps1
# Runs BEFORE every Write/Edit — blocks dangerous operations

param(
  [string]$ToolName,
  [string]$FilePath
)

# Check for hardcoded credentials
if ($ToolName -match "Write|Edit") {
  if (Test-Path $FilePath) {
    $content = Get-Content $FilePath -Raw

    # Block hardcoded Firebase keys
    if ($content -match 'VITE_FIREBASE_API_KEY\s*=\s*"AIza[a-zA-Z0-9_-]{35}"') {
      Write-Host "❌ BLOCKED: Hardcoded Firebase API key. Use .env file instead." -ForegroundColor Red
      exit 1
    }

    # Block hardcoded WiFi passwords
    if ($content -match '(password|WiFi|SSID)\s*=\s*"[a-zA-Z0-9]{6,}"' -and $FilePath -match '\.cpp$') {
      Write-Host "⚠️  WARNING: Potential hardcoded WiFi credentials in firmware. Use NVS partition instead." -ForegroundColor Yellow
    }

    # Block delay() > 50ms in firmware
    if ($FilePath -match 'firmware.*\.cpp$' -and $content -match 'delay\(([5-9][0-9]|[1-9][0-9]{2,})\)') {
      Write-Host "⚠️  WARNING: delay() > 50ms detected in firmware. This will block watchdog timer." -ForegroundColor Yellow
    }
  }
}

exit 0
