/**
 * Test Helper Utilities
 * Provides common utilities for testing
 */

/**
 * Mock Express Response
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock Express Request
 */
const mockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null,
    ...options,
  };
};

/**
 * Mock Next Function
 */
const mockNext = () => jest.fn();

/**
 * Mock Database Query Result
 */
const mockQueryResult = (rows = [], rowCount = 0) => {
  return {
    rows,
    rowCount: rowCount || rows.length,
    command: "SELECT",
    oid: null,
    fields: [],
  };
};

/**
 * Sample Inventory Data
 */
const sampleInventory = {
  id: 1,
  product_id: 100,
  sku: "TEST-SKU-001",
  quantity: 50,
  warehouse_location: "A-01-001",
  reorder_level: 10,
  max_stock_level: 200,
  last_restocked_at: new Date("2024-01-01"),
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

/**
 * Sample Stock Movement Data
 */
const sampleStockMovement = {
  id: 1,
  product_id: 100,
  sku: "TEST-SKU-001",
  movement_type: "in",
  quantity: 50,
  reference_id: null,
  reference_type: "initial_stock",
  notes: "Test stock movement",
  created_by: 1,
  created_at: new Date("2024-01-01"),
};

/**
 * Sample Product Data (from product service)
 */
const sampleProduct = {
  id: 100,
  sku: "TEST-SKU-001",
  name: "Test Product",
  description: "Test Description",
  category_id: 1,
  unit_price: 99.99,
  is_active: true,
  lifecycle_state: "active",
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

/**
 * Sample Low Stock Alert Data
 */
const sampleLowStockAlert = {
  id: 1,
  product_id: 100,
  sku: "TEST-SKU-001",
  current_quantity: 5,
  reorder_level: 10,
  alert_status: "active",
  notified_at: null,
  resolved_at: null,
  created_at: new Date("2024-01-01"),
};

/**
 * Wait for a specified time
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate random SKU
 */
const generateRandomSku = () => {
  return `TEST-SKU-${Math.random().toString(36).substring(7).toUpperCase()}`;
};

module.exports = {
  mockResponse,
  mockRequest,
  mockNext,
  mockQueryResult,
  sampleInventory,
  sampleStockMovement,
  sampleProduct,
  sampleLowStockAlert,
  wait,
  generateRandomSku,
};
