# Add Claude Code to PATH
$targetPath = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "Checking PATH configuration..." -ForegroundColor Cyan
Write-Host "Target: $targetPath" -ForegroundColor Yellow

if ($userPath -notlike "*$targetPath*") {
    Write-Host "`nAdding to PATH..." -ForegroundColor Cyan
    $newPath = $userPath + ";$targetPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ Successfully added $targetPath to user PATH" -ForegroundColor Green
} else {
    Write-Host "✅ $targetPath is already in user PATH" -ForegroundColor Green
}

Write-Host "`n⚠️  IMPORTANT: Restart your terminal/PowerShell for changes to take effect" -ForegroundColor Yellow
Write-Host "`nAfter restarting, verify with: claude --help" -ForegroundColor Cyan
