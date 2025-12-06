-- Migration: Update Existing Purchase Orders with SKUs
-- Purpose: Populate SKU field for existing purchase orders from product catalog
-- Date: 2025-12-06

\c supplier_db;

-- Update existing purchase orders with SKUs based on product_id
-- Using a pattern SKU-{product_id} as fallback
UPDATE purchase_orders 
SET sku = CONCAT('TEST-', LPAD(product_id::text, 3, '0'))
WHERE sku IS NULL AND product_id IS NOT NULL;

-- Show updated records
SELECT id, po_number, product_id, sku, requested_quantity, status 
FROM purchase_orders 
ORDER BY id;
