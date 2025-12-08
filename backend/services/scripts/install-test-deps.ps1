# Install Test Dependencies for All Services

Write-Host "`nInstalling test dependencies for all services...`n" -ForegroundColor Cyan

$services = @(
    "inventory-service",
    "order-service",
    "product-catalog-service",
    "supplier-service",
    "user-service"
)

foreach ($service in $services) {
    Write-Host "Installing dependencies for $service..." -ForegroundColor Yellow
    Push-Location "backend/services/$service"
    
    # Install Jest and Supertest
    npm install --save-dev jest@^29.7.0 supertest@^6.3.3
    
    Pop-Location
    Write-Host "✓ $service dependencies installed`n" -ForegroundColor Green
}

Write-Host "All test dependencies installed successfully!`n" -ForegroundColor Green
