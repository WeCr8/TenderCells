# PowerShell script for local development setup
# Run this script to set up the development environment

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "TenderCells UI - Development Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js v18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found. Please install npm." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Set up .env file
Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file from .env.example" -ForegroundColor Green
        Write-Host "  Please edit .env with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "⚠ .env.example not found. Creating default .env..." -ForegroundColor Yellow
        @"
# Frontend Configuration
VITE_API_BASE_URL=http://localhost:5173/api
VITE_SIM_MODE=true

# Backend Configuration
API_PORT=4000

# 3D Model Storage
VITE_MODEL_STORAGE_URL=http://localhost:5173/models
MAX_MODEL_FILE_SIZE=50MB
"@ | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "✓ Created default .env file" -ForegroundColor Green
    }
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Verify TypeScript
Write-Host ""
Write-Host "Verifying TypeScript configuration..." -ForegroundColor Yellow
npx tsc --noEmit 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript configuration is valid" -ForegroundColor Green
} else {
    Write-Host "⚠ TypeScript errors found. Run 'npx tsc --noEmit' for details" -ForegroundColor Yellow
}

# Run tests to verify setup
Write-Host ""
Write-Host "Running tests to verify setup..." -ForegroundColor Yellow
npm test -- --run --reporter=basic 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ All tests passing" -ForegroundColor Green
} else {
    Write-Host "⚠ Some tests failed. Run 'npm test' for details" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review and edit .env file if needed" -ForegroundColor White
Write-Host "  2. Start development server: npm run dev" -ForegroundColor White
Write-Host "  3. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "  4. Run tests: npm test" -ForegroundColor White
Write-Host ""




