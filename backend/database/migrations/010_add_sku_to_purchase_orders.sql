-- Migration: Add SKU to Purchase Orders
-- Purpose: Enable inventory updates by storing product SKU in purchase orders
-- Date: 2025-12-06

\c supplier_db;

-- Add sku column to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_sku ON purchase_orders(sku);

-- Add comment for documentation
COMMENT ON COLUMN purchase_orders.sku IS 'Product SKU for inventory tracking when receiving goods';

-- Update existing purchase orders with SKUs from product catalog if needed
-- This would need to be done via application code or manual update
-- Example: UPDATE purchase_orders SET sku = 'SKU-' || product_id WHERE sku IS NULL;
