# Simple test to run Claude Code CLI
$claudePath = "C:\Users\zach\.local\bin\claude.exe"

# Add to PATH for this session
$env:Path += ";C:\Users\zach\.local\bin"

Write-Host "Testing Claude Code CLI..." -ForegroundColor Cyan
Write-Host "Executable: $claudePath" -ForegroundColor Yellow
Write-Host ""

# Try running with --help first
Write-Host "1. Testing: claude --help" -ForegroundColor Green
& $claudePath --help
Write-Host ""

# Try running with --version
Write-Host "2. Testing: claude --version" -ForegroundColor Green
& $claudePath --version
Write-Host ""

# Try running without arguments (interactive mode)
Write-Host "3. Testing: claude (interactive)" -ForegroundColor Green
Write-Host "Note: This may start an interactive session" -ForegroundColor Yellow
& $claudePath
