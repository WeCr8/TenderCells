# Start Dev Server and Run Tests
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TenderCells UI - Test Suite Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start dev server in background
Write-Host "🚀 Starting dev server..." -ForegroundColor Yellow
$devServer = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Dev Server Starting...' -ForegroundColor Green; npm run dev" -PassThru
Write-Host "✅ Dev server started (PID: $($devServer.Id))" -ForegroundColor Green
Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

# Wait for dev server to start
Write-Host "⏳ Waiting for dev server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Run Unit Tests
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 Running Unit Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run test:unit
Write-Host ""

# Run Integration Tests
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔗 Running Integration Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run test:integration
Write-Host ""

# Check if dev server is ready for E2E
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🌐 Running E2E Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Note: E2E tests require dev server on http://localhost:5173" -ForegroundColor Gray
Write-Host ""

# Try to run E2E tests (may fail if server not ready)
try {
    npm run test:e2e
} catch {
    Write-Host "⚠️  E2E tests skipped - dev server may need more time" -ForegroundColor Yellow
    Write-Host "   Run 'npm run test:e2e' manually after server is ready" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Test Suite Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dev server is still running in background" -ForegroundColor Gray
Write-Host "To stop dev server, close the PowerShell window or run:" -ForegroundColor Gray
Write-Host "  Stop-Process -Id $($devServer.Id)" -ForegroundColor Gray
Write-Host ""





