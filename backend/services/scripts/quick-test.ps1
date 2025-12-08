# Quick Test Runner - Run Tests Without Coverage
# Faster execution for development

$services = @(
    "inventory-service",
    "order-service",
    "product-catalog-service",
    "supplier-service",
    "user-service"
)

Write-Host "Running quick tests (no coverage)...`n" -ForegroundColor Cyan

foreach ($service in $services) {
    Write-Host "Testing $service..." -ForegroundColor Yellow
    Push-Location "backend/services/$service"
    npm test -- --coverage=false --verbose=false
    Pop-Location
}

Write-Host "`nDone!`n" -ForegroundColor Green
