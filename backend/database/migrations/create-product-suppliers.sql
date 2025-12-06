-- Migration: Create product_suppliers junction table for many-to-many relationship
-- Purpose: Track which suppliers provide which products with pricing and terms
-- Database: supplier_db (cross-database relationship via application layer)

-- Create product_suppliers junction table
CREATE TABLE IF NOT EXISTS product_suppliers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,  -- References products(id) in product_catalog_db
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_unit_price NUMERIC(10,2) NOT NULL CHECK (supplier_unit_price >= 0),
    lead_time_days INTEGER DEFAULT 7 CHECK (lead_time_days >= 0),
    minimum_order_quantity INTEGER DEFAULT 1 CHECK (minimum_order_quantity >= 1),
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_supplier UNIQUE(product_id, supplier_id)
);

-- Create indexes for performance
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX idx_product_suppliers_active ON product_suppliers(is_active);
CREATE INDEX idx_product_suppliers_preferred ON product_suppliers(is_preferred);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_suppliers_updated_at
    BEFORE UPDATE ON product_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_product_suppliers_updated_at();

-- Add comment for documentation
COMMENT ON TABLE product_suppliers IS 'Junction table tracking which suppliers provide which products with pricing and terms';
COMMENT ON COLUMN product_suppliers.supplier_unit_price IS 'Price charged by this supplier for this product';
COMMENT ON COLUMN product_suppliers.lead_time_days IS 'Number of days from order to delivery';
COMMENT ON COLUMN product_suppliers.minimum_order_quantity IS 'Minimum quantity that must be ordered';
COMMENT ON COLUMN product_suppliers.is_preferred IS 'Whether this is the preferred supplier for this product';
