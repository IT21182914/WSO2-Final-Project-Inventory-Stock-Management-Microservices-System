-- Seed product-supplier relationships for demo
-- This assigns products to suppliers with realistic pricing and terms

-- IMPORTANT: Update product_ids and supplier_ids based on your actual data
-- Run this after verifying the IDs exist in your database

-- Supplier 1 (Test Supplier) - Electronics Supplier
-- Provides laptops and Apple products
INSERT INTO product_suppliers (product_id, supplier_id, supplier_unit_price, lead_time_days, minimum_order_quantity, is_preferred, notes)
VALUES
  (1, 1, 105.00, 5, 10, true, 'Primary supplier for test products'),
  (5, 1, 1250.00, 7, 5, true, 'Authorized laptop distributor'),
  (10, 1, 2500.00, 10, 3, true, 'Premium Apple products');

-- Supplier 3 (Dilan Shanuka - dilanshanuka9@gmail.com) - General Electronics
-- Provides laptops, bikes, and mid-range products
INSERT INTO product_suppliers (product_id, supplier_id, supplier_unit_price, lead_time_days, minimum_order_quantity, is_preferred, notes)
VALUES
  (5, 3, 1275.00, 10, 3, false, 'Alternative laptop supplier'),
  (9, 3, 95.00, 3, 15, true, 'Motorcycle parts specialist'),
  (13, 3, 580.00, 7, 10, true, 'Consumer electronics');

-- Supplier 4 (WSO2 Supplier - Thisari) - Premium Electronics
-- Provides high-end products and Apple items
INSERT INTO product_suppliers (product_id, supplier_id, supplier_unit_price, lead_time_days, minimum_order_quantity, is_preferred, notes)
VALUES
  (10, 4, 2550.00, 14, 2, false, 'Premium Apple distributor'),
  (13, 4, 575.00, 5, 5, false, 'High-end electronics'),
  (12, 4, 850000.00, 21, 1, true, 'Exclusive high-value items');

-- Supplier 2 (Dilan Shanuka - dilanshanuka99@gmail.com) - Budget Supplier
-- Provides affordable items
INSERT INTO product_suppliers (product_id, supplier_id, supplier_unit_price, lead_time_days, minimum_order_quantity, is_preferred, notes)
VALUES
  (2, 2, 95.00, 3, 20, true, 'Budget product supplier'),
  (4, 2, 14.00, 2, 50, true, 'Low-cost items'),
  (9, 2, 98.00, 5, 10, false, 'Alternative motorcycle parts');

-- Add some cross-product availability for realism
-- Multiple suppliers can provide the same product at different prices/terms
INSERT INTO product_suppliers (product_id, supplier_id, supplier_unit_price, lead_time_days, minimum_order_quantity, is_preferred, notes)
VALUES
  (2, 1, 98.00, 4, 15, false, 'Secondary test product supplier'),
  (4, 1, 14.50, 3, 30, false, 'Alternative supplier for budget items');

-- Show completed insertions
SELECT 
    ps.id,
    ps.product_id,
    ps.supplier_id,
    ps.supplier_unit_price,
    ps.lead_time_days,
    ps.minimum_order_quantity,
    ps.is_preferred,
    ps.notes
FROM product_suppliers ps
ORDER BY ps.supplier_id, ps.product_id;
