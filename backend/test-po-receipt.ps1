# Test Purchase Order Receipt and Inventory Update
# This script tests the complete flow of receiving a PO and updating inventory

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing PO Receipt -> Inventory Update" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current inventory
Write-Host "Step 1: Current inventory for Product 10:" -ForegroundColor Yellow
$inventoryBefore = docker exec -i ims-postgres psql -U postgres -d inventory_db -t -c "SELECT quantity, available_quantity FROM inventory WHERE product_id = 10;"
Write-Host $inventoryBefore -ForegroundColor Green
Write-Host ""

# Step 2: Receive PO #32 (100 units of product 10)
Write-Host "Step 2: Receiving PO #32 (100 units)..." -ForegroundColor Yellow
$receiveResult = Invoke-RestMethod -Uri "http://localhost:3004/api/purchase-orders/32/receive" `
    -Method PATCH `
    -ContentType "application/json" `
    -Body '{"notes": "Test receipt from PowerShell"}' `
    -ErrorAction SilentlyContinue

Write-Host "Response:" -ForegroundColor Green
$receiveResult | ConvertTo-Json -Depth 5
Write-Host ""

# Step 3: Check inventory after receipt
Write-Host "Step 3: Inventory after receipt:" -ForegroundColor Yellow
Start-Sleep -Seconds 2
$inventoryAfter = docker exec -i ims-postgres psql -U postgres -d inventory_db -t -c "SELECT quantity, available_quantity FROM inventory WHERE product_id = 10;"
Write-Host $inventoryAfter -ForegroundColor Green
Write-Host ""

# Step 4: Check stock movements
Write-Host "Step 4: Recent stock movements for Product 10:" -ForegroundColor Yellow
$movements = docker exec -i ims-postgres psql -U postgres -d inventory_db -c "SELECT movement_type, quantity, notes, created_at FROM stock_movements WHERE product_id = 10 ORDER BY created_at DESC LIMIT 3;"
Write-Host $movements
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "Expected: Inventory should increase from 50 to 150" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
