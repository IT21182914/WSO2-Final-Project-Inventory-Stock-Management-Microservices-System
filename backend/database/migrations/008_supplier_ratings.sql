-- Migration: Add Supplier Rating System
-- Purpose: Allow admin/warehouse staff to rate suppliers based on performance
-- Date: 2025-11-19

\c supplier_db;

-- Create supplier ratings table
CREATE TABLE IF NOT EXISTS supplier_ratings (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comments TEXT,
  rated_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(purchase_order_id) -- One rating per purchase order
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier_id 
  ON supplier_ratings(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_created_at 
  ON supplier_ratings(created_at);

-- Add average rating column to suppliers table
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Create function to update supplier average rating
CREATE OR REPLACE FUNCTION update_supplier_rating() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM supplier_ratings 
      WHERE supplier_id = NEW.supplier_id
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM supplier_ratings 
      WHERE supplier_id = NEW.supplier_id
    )
  WHERE id = NEW.supplier_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update average rating
DROP TRIGGER IF EXISTS trigger_update_supplier_rating ON supplier_ratings;
CREATE TRIGGER trigger_update_supplier_rating
  AFTER INSERT OR UPDATE OR DELETE ON supplier_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rating();

-- Create updated_at trigger for supplier_ratings
CREATE OR REPLACE FUNCTION update_supplier_rating_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_supplier_rating_updated_at ON supplier_ratings;
CREATE TRIGGER trigger_supplier_rating_updated_at
  BEFORE UPDATE ON supplier_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rating_timestamp();

COMMENT ON TABLE supplier_ratings IS 'Stores performance ratings for suppliers based on completed purchase orders';
COMMENT ON COLUMN supplier_ratings.rating IS 'Overall rating from 1-5 stars';
COMMENT ON COLUMN supplier_ratings.quality_rating IS 'Product quality rating from 1-5 stars';
COMMENT ON COLUMN supplier_ratings.delivery_rating IS 'Delivery timeliness rating from 1-5 stars';
COMMENT ON COLUMN supplier_ratings.communication_rating IS 'Communication/service rating from 1-5 stars';
