-- Migration: Add Purchase Request Approval Workflow
-- Purpose: Enable supplier approval/rejection of purchase requests
-- Date: 2025-11-19

\c supplier_db;

-- Add new columns for request approval workflow
ALTER TABLE purchase_orders 
  ADD COLUMN IF NOT EXISTS supplier_response VARCHAR(20) 
    CHECK (supplier_response IN ('pending', 'approved', 'rejected', 'partially_approved')),
  ADD COLUMN IF NOT EXISTS requested_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS approved_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS supplier_notes TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;

-- Update status enum to include new workflow states
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check 
  CHECK (status IN ('draft', 'pending', 'confirmed', 'preparing', 'shipped', 'received', 'cancelled', 'rejected'));

-- Set default supplier_response for new records
UPDATE purchase_orders 
SET supplier_response = 'pending' 
WHERE supplier_response IS NULL AND status IN ('pending', 'draft');

-- Create index for faster supplier queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_response 
  ON purchase_orders(supplier_response);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_responded_at 
  ON purchase_orders(responded_at);

-- Add user_id to suppliers table if not exists (for login mapping)
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS user_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id 
  ON suppliers(user_id);

-- Update existing records to have proper initial state
UPDATE purchase_orders 
SET 
  supplier_response = 'pending',
  status = 'pending'
WHERE status = 'draft' OR status = 'submitted';

COMMENT ON COLUMN purchase_orders.supplier_response IS 'Supplier response to purchase request: pending, approved, rejected, partially_approved';
COMMENT ON COLUMN purchase_orders.requested_quantity IS 'Total quantity originally requested';
COMMENT ON COLUMN purchase_orders.approved_quantity IS 'Quantity supplier can supply (may be less than requested)';
COMMENT ON COLUMN purchase_orders.rejection_reason IS 'Reason if supplier rejects the request';
COMMENT ON COLUMN purchase_orders.estimated_delivery_date IS 'Delivery date promised by supplier';
COMMENT ON COLUMN purchase_orders.tracking_number IS 'Shipment tracking number provided by supplier';
