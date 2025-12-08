/**
 * Product Model Tests
 */

const Product = require("../../src/models/product.model");
const db = require("../../src/config/database");
const { mockQueryResult, sampleProduct } = require("../utils/testHelpers");

jest.mock("../../src/config/database");
jest.mock("../../src/config/logger");

describe("Product Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create product successfully", async () => {
      const productData = {
        sku: "TEST-SKU-001",
        name: "Test Product",
        description: "Test Description",
        category_id: 1,
        size: "M",
        color: "Blue",
        unit_price: 99.99,
        supplier_id: 10,
      };

      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      const result = await Product.create(productData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(sampleProduct);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("INSERT INTO products");
    });

    it("should handle JSON attributes", async () => {
      const productData = {
        sku: "TEST-SKU-001",
        name: "Test Product",
        attributes: { material: "cotton", weight: "500g" },
      };

      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      await Product.create(productData);

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[1]).toContain(JSON.stringify(productData.attributes));
    });
  });

  describe("findAll", () => {
    it("should find all products", async () => {
      const products = [sampleProduct, { ...sampleProduct, id: 101 }];
      db.query.mockResolvedValue(mockQueryResult(products));

      const result = await Product.findAll();

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(products);
      expect(result).toHaveLength(2);
    });

    it("should filter by category_id", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      await Product.findAll({ category_id: 1 });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("category_id = $");
      expect(queryCall[1]).toContain(1);
    });

    it("should filter by is_active", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      await Product.findAll({ is_active: true });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("is_active = $");
      expect(queryCall[1]).toContain(true);
    });

    it("should filter by search term", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      await Product.findAll({ search: "test" });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("ILIKE");
    });

    it("should filter by supplier_id", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      await Product.findAll({ supplier_id: 10 });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("supplier_id = $");
    });
  });

  describe("findById", () => {
    it("should find product by ID", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      const result = await Product.findById(100);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = $1"),
        [100]
      );
      expect(result).toEqual(sampleProduct);
    });

    it("should return undefined if not found", async () => {
      db.query.mockResolvedValue(mockQueryResult([]));

      const result = await Product.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe("findBySku", () => {
    it("should find product by SKU", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleProduct]));

      const result = await Product.findBySku("TEST-SKU-001");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE sku = $1"),
        ["TEST-SKU-001"]
      );
      expect(result).toEqual(sampleProduct);
    });
  });

  describe("update", () => {
    it("should update product successfully", async () => {
      const updateData = {
        name: "Updated Product",
        unit_price: 149.99,
      };
      const updatedProduct = { ...sampleProduct, ...updateData };
      db.query.mockResolvedValue(mockQueryResult([updatedProduct]));

      const result = await Product.update(100, updateData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(updatedProduct);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("UPDATE products");
    });
  });

  describe("softDelete", () => {
    it("should soft delete product", async () => {
      const deletedProduct = { ...sampleProduct, is_active: false };
      db.query.mockResolvedValue(mockQueryResult([deletedProduct]));

      const result = await Product.softDelete(100);

      expect(db.query).toHaveBeenCalled();
      expect(result.is_active).toBe(false);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("UPDATE products");
      expect(queryCall[0]).toContain("is_active = false");
    });
  });

  describe("delete", () => {
    it("should hard delete product", async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const result = await Product.delete(100);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM products"),
        [100]
      );
      expect(result).toBe(true);
    });

    it("should return false if not found", async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const result = await Product.delete(999);

      expect(result).toBe(false);
    });
  });
});
