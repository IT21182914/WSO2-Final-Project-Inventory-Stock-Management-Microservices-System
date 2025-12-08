/**
 * Stock Movement Model Tests
 */

const StockMovement = require("../../src/models/stockMovement.model");
const db = require("../../src/config/database");
const {
  mockQueryResult,
  sampleStockMovement,
} = require("../utils/testHelpers");

jest.mock("../../src/config/database");
jest.mock("../../src/config/logger");

describe("StockMovement Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create stock movement successfully", async () => {
      const movementData = {
        product_id: 100,
        sku: "TEST-SKU-001",
        movement_type: "in",
        quantity: 50,
        reference_type: "purchase_order",
        reference_id: 1,
        notes: "Stock receipt",
      };

      db.query.mockResolvedValue(mockQueryResult([sampleStockMovement]));

      const result = await StockMovement.create(movementData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(sampleStockMovement);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("INSERT INTO stock_movements");
    });

    it("should validate movement type", async () => {
      const movementData = {
        product_id: 100,
        movement_type: "invalid",
        quantity: 50,
      };

      db.query.mockRejectedValue(new Error("Invalid movement type"));

      await expect(StockMovement.create(movementData)).rejects.toThrow(
        "Invalid movement type"
      );
    });
  });

  describe("findAll", () => {
    it("should find all stock movements", async () => {
      const movements = [
        sampleStockMovement,
        { ...sampleStockMovement, id: 2 },
      ];
      db.query.mockResolvedValue(mockQueryResult(movements));

      const result = await StockMovement.findAll();

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(movements);
    });

    it("should filter by product_id", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleStockMovement]));

      await StockMovement.findAll({ product_id: 100 });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("product_id = $");
    });

    it("should filter by movement_type", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleStockMovement]));

      await StockMovement.findAll({ movement_type: "in" });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("movement_type = $");
    });

    it("should filter by date range", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleStockMovement]));

      await StockMovement.findAll({
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("created_at >=");
      expect(queryCall[0]).toContain("created_at <=");
    });
  });

  describe("findByProductId", () => {
    it("should find movements by product ID", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleStockMovement]));

      const result = await StockMovement.findByProductId(100);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE product_id = $1"),
        [100]
      );
      expect(result).toEqual([sampleStockMovement]);
    });
  });
});
