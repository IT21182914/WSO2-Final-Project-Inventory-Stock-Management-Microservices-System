/**
 * Inventory Model Tests
 * Tests for inventory data access layer
 */

const Inventory = require("../../src/models/inventory.model");
const db = require("../../src/config/database");
const { mockQueryResult, sampleInventory } = require("../utils/testHelpers");

jest.mock("../../src/config/database");
jest.mock("../../src/config/logger");

describe("Inventory Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create inventory record successfully", async () => {
      const inventoryData = {
        product_id: 100,
        sku: "TEST-SKU-001",
        quantity: 50,
        warehouse_location: "A-01-001",
        reorder_level: 10,
        max_stock_level: 200,
      };

      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      const result = await Inventory.create(inventoryData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(sampleInventory);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("INSERT INTO inventory");
      expect(queryCall[1]).toContain(inventoryData.product_id);
    });

    it("should use default values for optional fields", async () => {
      const inventoryData = {
        product_id: 100,
        sku: "TEST-SKU-001",
        warehouse_location: "A-01-001",
      };

      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      await Inventory.create(inventoryData);

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[1]).toContain(0); // default quantity
      expect(queryCall[1]).toContain(10); // default reorder_level
      expect(queryCall[1]).toContain(1000); // default max_stock_level
    });

    it("should throw error on database failure", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(
        Inventory.create({ product_id: 100, sku: "TEST" })
      ).rejects.toThrow("Database error");
    });
  });

  describe("findAll", () => {
    it("should find all inventory records", async () => {
      const inventoryList = [sampleInventory, { ...sampleInventory, id: 2 }];
      db.query.mockResolvedValue(mockQueryResult(inventoryList));

      const result = await Inventory.findAll();

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(inventoryList);
      expect(result).toHaveLength(2);
    });

    it("should filter by product_id", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      await Inventory.findAll({ product_id: 100 });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("product_id = $1");
      expect(queryCall[1]).toContain(100);
    });

    it("should filter low stock items", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      await Inventory.findAll({ low_stock: true });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("quantity <= reorder_level");
    });

    it("should return empty array when no records found", async () => {
      db.query.mockResolvedValue(mockQueryResult([]));

      const result = await Inventory.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findByProductId", () => {
    it("should find inventory by product ID", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      const result = await Inventory.findByProductId(100);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE product_id = $1"),
        [100]
      );
      expect(result).toEqual(sampleInventory);
    });

    it("should return undefined if not found", async () => {
      db.query.mockResolvedValue(mockQueryResult([]));

      const result = await Inventory.findByProductId(999);

      expect(result).toBeUndefined();
    });
  });

  describe("findBySku", () => {
    it("should find inventory by SKU", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      const result = await Inventory.findBySku("TEST-SKU-001");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE sku = $1"),
        ["TEST-SKU-001"]
      );
      expect(result).toEqual(sampleInventory);
    });
  });

  describe("findById", () => {
    it("should find inventory by ID", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      const result = await Inventory.findById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = $1"),
        [1]
      );
      expect(result).toEqual(sampleInventory);
    });
  });

  describe("update", () => {
    it("should update inventory record", async () => {
      const updateData = {
        warehouse_location: "B-01-001",
        reorder_level: 15,
      };
      const updatedInventory = { ...sampleInventory, ...updateData };
      db.query.mockResolvedValue(mockQueryResult([updatedInventory]));

      const result = await Inventory.update(100, updateData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(updatedInventory);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("UPDATE inventory");
      expect(queryCall[0]).toContain("WHERE product_id = $");
    });

    it("should return undefined if record not found", async () => {
      db.query.mockResolvedValue(mockQueryResult([]));

      const result = await Inventory.update(999, {
        warehouse_location: "C-01-001",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("should delete inventory record", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleInventory]));

      const result = await Inventory.delete(100);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM inventory"),
        [100]
      );
      expect(result).toEqual(sampleInventory);
    });

    it("should return undefined if record not found", async () => {
      db.query.mockResolvedValue(mockQueryResult([]));

      const result = await Inventory.delete(999);

      expect(result).toBeUndefined();
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity and last_restocked_at", async () => {
      const updatedInventory = { ...sampleInventory, quantity: 100 };
      db.query.mockResolvedValue(mockQueryResult([updatedInventory]));

      const result = await Inventory.updateQuantity(1, 100);

      expect(db.query).toHaveBeenCalled();
      expect(result.quantity).toBe(100);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("quantity =");
      expect(queryCall[0]).toContain("last_restocked_at");
    });
  });
});
