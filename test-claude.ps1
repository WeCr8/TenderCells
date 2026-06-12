# Test Claude Code CLI
Write-Host "=== Claude Code CLI Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check if executable exists
$claudePath = "$env:USERPROFILE\.local\bin\claude.exe"
Write-Host "1. Checking executable..." -ForegroundColor Yellow
if (Test-Path $claudePath) {
    $file = Get-Item $claudePath
    Write-Host "   ✓ Found: $($file.FullName)" -ForegroundColor Green
    Write-Host "   Size: $($file.Length) bytes" -ForegroundColor Gray
    Write-Host "   Modified: $($file.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "   ✗ Not found at: $claudePath" -ForegroundColor Red
    exit 1
}

# Check PATH
Write-Host "`n2. Checking PATH..." -ForegroundColor Yellow
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -like "*$env:USERPROFILE\.local\bin*") {
    Write-Host "   ✓ PATH contains .local\bin" -ForegroundColor Green
} else {
    Write-Host "   ✗ PATH does NOT contain .local\bin" -ForegroundColor Red
    Write-Host "   Adding to PATH for this session..." -ForegroundColor Yellow
    $env:Path += ";$env:USERPROFILE\.local\bin"
}

# Check if command is available
Write-Host "`n3. Checking if 'claude' command is available..." -ForegroundColor Yellow
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
    Write-Host "   ✓ Command found: $($claudeCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Command not found in PATH" -ForegroundColor Red
    Write-Host "   Trying with full path..." -ForegroundColor Yellow
}

# Try to run claude
Write-Host "`n4. Attempting to run Claude Code..." -ForegroundColor Yellow
Write-Host "   Command: claude --version" -ForegroundColor Gray
try {
    $output = & $claudePath --version 2>&1
    if ($output) {
        Write-Host "   Output: $output" -ForegroundColor Green
    } else {
        Write-Host "   (No output, but command executed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host "`n5. Testing interactive run..." -ForegroundColor Yellow
Write-Host "   Note: If Claude Code is interactive, it may wait for input" -ForegroundColor Gray
Write-Host "   Trying: claude (no arguments)" -ForegroundColor Gray

# Check Node.js (Claude Code might need it)
Write-Host "`n6. Checking dependencies..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $nodeVersion = node --version 2>&1
    Write-Host "   ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Node.js not found (may be required)" -ForegroundColor Yellow
}

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host "`nTo use Claude Code in a new terminal:" -ForegroundColor Yellow
Write-Host "1. Close and reopen your terminal" -ForegroundColor White
Write-Host "2. Navigate to your project: cd '$PWD'" -ForegroundColor White
Write-Host "3. Run: claude" -ForegroundColor White
