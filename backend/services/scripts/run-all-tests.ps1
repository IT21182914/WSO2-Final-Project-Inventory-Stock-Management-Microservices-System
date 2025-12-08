# Test Runner Script for All Microservices
# Runs unit tests for all services and generates coverage reports

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Microservices Unit Test Runner" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Define services
$services = @(
    "inventory-service",
    "order-service", 
    "product-catalog-service",
    "supplier-service",
    "user-service"
)

$baseDir = "backend/services"
$totalPassed = 0
$totalFailed = 0
$results = @()

# Run tests for each service
foreach ($service in $services) {
    Write-Host "`n=== Testing $service ===" -ForegroundColor Green
    Write-Host "Location: $baseDir/$service`n" -ForegroundColor Gray
    
    Push-Location "$baseDir/$service"
    
    try {
        # Check if node_modules exists
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..." -ForegroundColor Yellow
            npm install
        }
        
        # Run tests
        $output = npm test 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "✓ $service - PASSED" -ForegroundColor Green
            $totalPassed++
            $results += @{Service=$service; Status="PASSED"; ExitCode=$exitCode}
        } else {
            Write-Host "✗ $service - FAILED" -ForegroundColor Red
            $totalFailed++
            $results += @{Service=$service; Status="FAILED"; ExitCode=$exitCode}
        }
    }
    catch {
        Write-Host "✗ $service - ERROR: $_" -ForegroundColor Red
        $totalFailed++
        $results += @{Service=$service; Status="ERROR"; ExitCode=-1}
    }
    finally {
        Pop-Location
    }
}

# Print summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($result in $results) {
    $status = $result.Status
    $color = if ($status -eq "PASSED") { "Green" } else { "Red" }
    Write-Host "$($result.Service): $status" -ForegroundColor $color
}

Write-Host "`nTotal Services: $($services.Count)" -ForegroundColor White
Write-Host "Passed: $totalPassed" -ForegroundColor Green
Write-Host "Failed: $totalFailed" -ForegroundColor Red

if ($totalFailed -eq 0) {
    Write-Host "`n✓ All tests passed successfully!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed. Please review the output above.`n" -ForegroundColor Red
    exit 1
}
