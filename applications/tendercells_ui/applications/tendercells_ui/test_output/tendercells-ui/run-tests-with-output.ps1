# Test Runner Script with Output
Write-Host "🚀 Starting TenderCells UI Test Suite..." -ForegroundColor Cyan
Write-Host ""

# Change to test directory
Set-Location $PSScriptRoot

# Run unit tests
Write-Host "📦 Running Unit Tests..." -ForegroundColor Yellow
npm run test:unit
Write-Host ""

# Run integration tests  
Write-Host "🔗 Running Integration Tests..." -ForegroundColor Yellow
npm run test:integration
Write-Host ""

# Run E2E tests (if dev server is running)
Write-Host "🌐 Running E2E Tests..." -ForegroundColor Yellow
Write-Host "Note: E2E tests require dev server to be running on http://localhost:5173" -ForegroundColor Gray
npm run test:e2e
Write-Host ""

Write-Host "✅ Test Suite Complete!" -ForegroundColor Green





