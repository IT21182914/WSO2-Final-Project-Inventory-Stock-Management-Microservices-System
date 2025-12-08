/**
 * Logger Mock
 * Mocks Winston logger
 */

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

jest.mock("../../src/config/logger", () => mockLogger);

const resetMocks = () => {
  mockLogger.info.mockReset();
  mockLogger.error.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.debug.mockReset();
  mockLogger.verbose.mockReset();
};

module.exports = {
  mockLogger,
  resetMocks,
};
