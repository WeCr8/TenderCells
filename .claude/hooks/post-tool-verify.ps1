# .claude/hooks/post-tool-verify.ps1
# Runs AFTER Write/Edit on source files — triggers relevant checks

param(
  [string]$ToolName,
  [string]$FilePath
)

$repoRoot = "c:\Users\zach\Documents\Projects\TenderCells"

if ($ToolName -match "Write|Edit") {

  # TypeScript check after app changes
  if ($FilePath -match 'app.*\.(tsx?|ts)$') {
    Write-Host "→ TypeScript check on $(Split-Path -Leaf $FilePath)..."
    Set-Location $repoRoot
    $tsOutput = npx tsc --noEmit --quiet 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Host "❌ TypeScript errors found:" -ForegroundColor Red
      $tsOutput | Select-Object -First 10
    } else {
      Write-Host "✅ TypeScript OK" -ForegroundColor Green
    }
  }

  # PlatformIO build check after firmware changes
  if ($FilePath -match 'firmware/chicken-tender/.*\.cpp$') {
    Write-Host "→ Building chicken-tender firmware..."
    Set-Location "$repoRoot/firmware/chicken-tender"
    if ((Test-Path "platformio.ini")) {
      $buildOutput = pio run 2>&1 | Select-Object -Last 5
      if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firmware build OK" -ForegroundColor Green
      } else {
        Write-Host "❌ Firmware build FAILED:" -ForegroundColor Red
        $buildOutput
      }
    }
  }

  # Security check for .env changes
  if ($FilePath -match '\.env$') {
    Write-Host "⚠️  WARNING: .env file modified. Ensure no secrets are committed." -ForegroundColor Yellow
  }
}

exit 0
