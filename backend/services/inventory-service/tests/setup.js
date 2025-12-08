// Global test setup
process.env.NODE_ENV = "test";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_NAME = "test_inventory_db";
process.env.DB_USER = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.PORT = "3001";

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
