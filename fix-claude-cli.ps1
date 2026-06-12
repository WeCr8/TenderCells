# Fix Claude Code CLI startup issues
Write-Host "=== Claude Code CLI Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify executable exists
$claudePath = "$env:USERPROFILE\.local\bin\claude.exe"
if (-not (Test-Path $claudePath)) {
    Write-Host "ERROR: Claude executable not found at $claudePath" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Executable found" -ForegroundColor Green

# Step 2: Ensure PATH is set in user environment
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$targetPath = "$env:USERPROFILE\.local\bin"

if ($userPath -notlike "*$targetPath*") {
    Write-Host "Adding to user PATH..." -ForegroundColor Yellow
    $newPath = if ($userPath) { "$userPath;$targetPath" } else { $targetPath }
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✓ Added to user PATH" -ForegroundColor Green
} else {
    Write-Host "✓ Already in user PATH" -ForegroundColor Green
}

# Step 3: Update current session PATH
$env:Path += ";$targetPath"
Write-Host "✓ Updated current session PATH" -ForegroundColor Green

# Step 4: Verify command is available
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
    Write-Host "✓ 'claude' command is now available" -ForegroundColor Green
    Write-Host "  Location: $($claudeCmd.Source)" -ForegroundColor Gray
} else {
    Write-Host "⚠ Command not yet available (may need new terminal)" -ForegroundColor Yellow
}

# Step 5: Test the executable
Write-Host "`nTesting Claude Code CLI..." -ForegroundColor Cyan
Write-Host "Running: claude --help" -ForegroundColor Gray
Write-Host ""

try {
    # Try to get help output
    $helpOutput = & $claudePath --help 2>&1 | Out-String
    if ($helpOutput.Trim()) {
        Write-Host $helpOutput -ForegroundColor White
    } else {
        Write-Host "No output (this may be normal for interactive CLIs)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error running claude: $_" -ForegroundColor Red
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal/PowerShell" -ForegroundColor Yellow
Write-Host "2. Navigate to your project: cd '$PWD'" -ForegroundColor Yellow
Write-Host "3. Try running: claude" -ForegroundColor Yellow
Write-Host "4. If it's your first time, you may need to authenticate:" -ForegroundColor Yellow
Write-Host "   claude auth login" -ForegroundColor White
Write-Host "`nIf it still doesn't work, try running with full path:" -ForegroundColor Yellow
Write-Host "   & '$claudePath'" -ForegroundColor White
