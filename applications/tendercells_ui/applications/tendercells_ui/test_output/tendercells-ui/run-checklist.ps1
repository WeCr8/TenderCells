# PowerShell wrapper for Component Checklist
param(
    [Parameter(Position=0)]
    [string]$Command = "scan"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Component Checklist Manager" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$pythonCommand = "python"
$scriptPath = "component_checklist.py"

# Check if Python is available
try {
    $pythonVersion = & $pythonCommand --version 2>&1
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found. Please install Python." -ForegroundColor Red
    exit 1
}

Write-Host "Running: $pythonCommand $scriptPath $Command" -ForegroundColor Yellow
Write-Host ""

# Run the script
& $pythonCommand $scriptPath $Command

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✓ Command completed successfully!" -ForegroundColor Green
    
    # Check if checklist file was created
    if (Test-Path "component_checklist.json") {
        Write-Host "✓ Checklist file created: component_checklist.json" -ForegroundColor Green
        
        # Show summary
        try {
            $checklist = Get-Content "component_checklist.json" | ConvertFrom-Json
            $componentCount = $checklist.components.Count
            Write-Host "✓ Found $componentCount components" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not parse checklist file" -ForegroundColor Yellow
        }
    }
    
    # Check if markdown report exists
    if (Test-Path "COMPONENT_CHECKLIST.md") {
        Write-Host "✓ Markdown report created: COMPONENT_CHECKLIST.md" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "✗ Command failed with exit code: $exitCode" -ForegroundColor Red
}

Write-Host ""




