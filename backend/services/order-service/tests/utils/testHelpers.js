/**
 * Test Helper Utilities for Order Service
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

const sampleOrder = {
  id: 1,
  customer_id: 100,
  order_number: "ORD-20240101-001",
  status: "pending",
  total_amount: 299.97,
  shipping_address: "123 Test St, Test City",
  payment_method: "credit_card",
  payment_status: "pending",
  notes: "Test order",
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const sampleOrderItem = {
  id: 1,
  order_id: 1,
  product_id: 100,
  sku: "TEST-SKU-001",
  quantity: 3,
  unit_price: 99.99,
  subtotal: 299.97,
  created_at: new Date("2024-01-01"),
};

const sampleOrderWithItems = {
  ...sampleOrder,
  items: [sampleOrderItem],
};

module.exports = {
  mockResponse,
  mockRequest,
  mockNext,
  mockQueryResult,
  sampleOrder,
  sampleOrderItem,
  sampleOrderWithItems,
};
