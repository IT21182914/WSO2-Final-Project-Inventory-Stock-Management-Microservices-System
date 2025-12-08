/**
 * Test Helper Utilities for Supplier Service
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

const sampleSupplier = {
  id: 10,
  name: "Test Supplier Inc.",
  contact_person: "John Doe",
  email: "contact@testsupplier.com",
  phone: "+1-555-0100",
  address: "123 Supplier St",
  city: "Supply City",
  country: "USA",
  is_active: true,
  rating: 4.5,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const samplePurchaseOrder = {
  id: 1,
  po_number: "PO-20240101-001",
  supplier_id: 10,
  order_date: new Date("2024-01-01"),
  expected_delivery_date: new Date("2024-01-15"),
  status: "pending",
  total_amount: 1000.0,
  notes: "Test purchase order",
  created_by: 1,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const sampleSupplierRating = {
  id: 1,
  supplier_id: 10,
  rating: 5,
  comment: "Excellent service",
  rated_by: 1,
  created_at: new Date("2024-01-01"),
};

module.exports = {
  mockResponse,
  mockRequest,
  mockNext,
  mockQueryResult,
  sampleSupplier,
  samplePurchaseOrder,
  sampleSupplierRating,
};
