/**
 * Test Helper Utilities for Product Catalog Service
 */

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

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

const mockNext = () => jest.fn();

const mockQueryResult = (rows = [], rowCount = 0) => {
  return {
    rows,
    rowCount: rowCount || rows.length,
    command: "SELECT",
    oid: null,
    fields: [],
  };
};

const sampleProduct = {
  id: 100,
  sku: "TEST-SKU-001",
  name: "Test Product",
  description: "This is a test product",
  category_id: 1,
  size: "M",
  color: "Blue",
  unit_price: 99.99,
  supplier_id: 10,
  is_active: true,
  lifecycle_state: "active",
  attributes: { material: "cotton", weight: "500g" },
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const sampleCategory = {
  id: 1,
  name: "Electronics",
  description: "Electronic products",
  parent_id: null,
  is_active: true,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const samplePricing = {
  id: 1,
  product_id: 100,
  price_type: "standard",
  amount: 99.99,
  currency: "USD",
  start_date: new Date("2024-01-01"),
  end_date: null,
  is_active: true,
  created_at: new Date("2024-01-01"),
};

module.exports = {
  mockResponse,
  mockRequest,
  mockNext,
  mockQueryResult,
  sampleProduct,
  sampleCategory,
  samplePricing,
};
