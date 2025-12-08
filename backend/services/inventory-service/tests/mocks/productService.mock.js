/**
 * Product Service Client Mock
 * Mocks external product service calls
 */

const mockGetProductById = jest.fn();
const mockGetProductBySku = jest.fn();

jest.mock("../../src/services/productService.client", () => ({
  getProductById: mockGetProductById,
  getProductBySku: mockGetProductBySku,
}));

const resetMocks = () => {
  mockGetProductById.mockReset();
  mockGetProductBySku.mockReset();
};

module.exports = {
  mockGetProductById,
  mockGetProductBySku,
  resetMocks,
};
