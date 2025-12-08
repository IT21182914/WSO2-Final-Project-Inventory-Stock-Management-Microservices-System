/**
 * Database Mock
 * Mocks PostgreSQL database connections and queries
 */

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();

const mockClient = {
  query: mockQuery,
  release: mockRelease,
};

const mockPool = {
  query: mockQuery,
  connect: jest.fn(() => Promise.resolve(mockClient)),
  end: jest.fn(),
  totalCount: 10,
  idleCount: 5,
  waitingCount: 0,
};

// Mock the database module
jest.mock("../../src/config/database", () => ({
  query: mockQuery,
  pool: mockPool,
  connect: mockConnect,
}));

const resetMocks = () => {
  mockQuery.mockReset();
  mockConnect.mockReset();
  mockRelease.mockReset();
  mockPool.connect.mockReset();
  mockPool.end.mockReset();
};

module.exports = {
  mockQuery,
  mockConnect,
  mockRelease,
  mockClient,
  mockPool,
  resetMocks,
};
