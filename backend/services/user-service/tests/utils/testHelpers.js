/**
 * Test Helper Utilities for User Service
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

const sampleUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  full_name: "Test User",
  role: "staff",
  is_active: true,
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01"),
};

const sampleUserWithPassword = {
  ...sampleUser,
  password_hash: "$2b$10$hashedpassword",
};

module.exports = {
  mockResponse,
  mockRequest,
  mockNext,
  mockQueryResult,
  sampleUser,
  sampleUserWithPassword,
};
