# Verification script for development setup
Write-Host "Verifying TenderCells UI Development Setup..." -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found" -ForegroundColor Red
    $allGood = $false
}

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Dependencies not installed. Run: npm install" -ForegroundColor Red
    $allGood = $false
}

# Check .env
Write-Host "Checking environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ .env file not found. Run: cp .env.example .env" -ForegroundColor Yellow
}

# Check TypeScript
Write-Host "Checking TypeScript..." -ForegroundColor Yellow
if (Test-Path "node_modules/typescript") {
    Write-Host "  ✓ TypeScript installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ TypeScript not found" -ForegroundColor Red
    $allGood = $false
}

# Check Vite
Write-Host "Checking Vite..." -ForegroundColor Yellow
if (Test-Path "node_modules/vite") {
    Write-Host "  ✓ Vite installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Vite not found" -ForegroundColor Red
    $allGood = $false
}

# Check test setup
Write-Host "Checking test setup..." -ForegroundColor Yellow
if (Test-Path "node_modules/vitest") {
    Write-Host "  ✓ Vitest installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Vitest not found" -ForegroundColor Red
    $allGood = $false
}

# Check source files
Write-Host "Checking source files..." -ForegroundColor Yellow
if (Test-Path "src/main.tsx") {
    Write-Host "  ✓ Source files found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Source files not found" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
if ($allGood) {
    Write-Host "✓ Setup looks good! You're ready to develop." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. npm run dev        - Start development server" -ForegroundColor White
    Write-Host "  2. npm test           - Run tests" -ForegroundColor White
    Write-Host "  3. npm run lint       - Check code quality" -ForegroundColor White
} else {
    Write-Host "✗ Setup incomplete. Please fix the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Run the setup script:" -ForegroundColor Yellow
    Write-Host "  .\setup-dev.ps1" -ForegroundColor White
}

Write-Host ""




