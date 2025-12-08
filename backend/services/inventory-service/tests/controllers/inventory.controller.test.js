/**
 * Inventory Controller Tests
 * Tests for inventory management operations
 */

const inventoryController = require("../../src/controllers/inventory.controller");
const Inventory = require("../../src/models/inventory.model");
const StockMovement = require("../../src/models/stockMovement.model");
const ProductServiceClient = require("../../src/services/productService.client");
const {
  mockRequest,
  mockResponse,
  sampleInventory,
  sampleProduct,
} = require("../utils/testHelpers");

// Mock dependencies
jest.mock("../../src/models/inventory.model");
jest.mock("../../src/models/stockMovement.model");
jest.mock("../../src/services/productService.client");
jest.mock("../../src/config/logger");

describe("InventoryController", () => {
  let req;
  let res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createInventory", () => {
    beforeEach(() => {
      req.body = {
        product_id: 100,
        sku: "TEST-SKU-001",
        quantity: 50,
        warehouse_location: "A-01-001",
        reorder_level: 10,
        max_stock_level: 200,
      };
    });

    it("should create inventory successfully", async () => {
      ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);
      Inventory.findByProductId.mockResolvedValue(null);
      Inventory.create.mockResolvedValue(sampleInventory);
      StockMovement.create.mockResolvedValue({});

      await inventoryController.createInventory(req, res);

      expect(ProductServiceClient.getProductById).toHaveBeenCalledWith(100);
      expect(Inventory.findByProductId).toHaveBeenCalledWith(100);
      expect(Inventory.create).toHaveBeenCalledWith(req.body);
      expect(StockMovement.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Inventory created successfully",
        data: sampleInventory,
      });
    });

    it("should return 400 if inventory already exists", async () => {
      ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);
      Inventory.findByProductId.mockResolvedValue(sampleInventory);

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Inventory already exists for this product",
      });
    });

    it("should handle product service errors", async () => {
      ProductServiceClient.getProductById.mockRejectedValue(
        new Error("Product service unavailable")
      );

      await inventoryController.createInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error creating inventory",
        error: "Product service unavailable",
      });
    });

    it("should not create stock movement if quantity is 0", async () => {
      req.body.quantity = 0;
      ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);
      Inventory.findByProductId.mockResolvedValue(null);
      Inventory.create.mockResolvedValue({ ...sampleInventory, quantity: 0 });

      await inventoryController.createInventory(req, res);

      expect(StockMovement.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getAllInventory", () => {
    it("should get all inventory successfully", async () => {
      const inventoryList = [sampleInventory, { ...sampleInventory, id: 2 }];
      Inventory.findAll.mockResolvedValue(inventoryList);
      ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);

      await inventoryController.getAllInventory(req, res);

      expect(Inventory.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
        })
      );
    });

    it("should filter low stock items", async () => {
      req.query = { low_stock: "true" };
      Inventory.findAll.mockResolvedValue([sampleInventory]);
      ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);

      await inventoryController.getAllInventory(req, res);

      expect(Inventory.findAll).toHaveBeenCalledWith({ low_stock: true });
      expect(res.json).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      Inventory.findAll.mockRejectedValue(new Error("Database error"));

      await inventoryController.getAllInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching inventory",
        error: "Database error",
      });
    });
  });

  describe("getInventoryById", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("should get inventory by ID successfully", async () => {
      Inventory.findById.mockResolvedValue(sampleInventory);

      await inventoryController.getInventoryById(req, res);

      expect(Inventory.findById).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 1,
            product_id: 100,
          }),
        })
      );
    });

    it("should return 404 if inventory not found", async () => {
      Inventory.findById.mockResolvedValue(null);

      await inventoryController.getInventoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Inventory not found",
      });
    });
  });

  describe("updateInventory", () => {
    beforeEach(() => {
      req.params = { productId: "100" };
      req.body = {
        quantity: 75,
        warehouse_location: "A-01-002",
        reorder_level: 15,
      };
    });

    it("should update inventory successfully", async () => {
      const updatedInventory = { ...sampleInventory, ...req.body };
      Inventory.update.mockResolvedValue(updatedInventory);

      await inventoryController.updateInventory(req, res);

      expect(Inventory.update).toHaveBeenCalledWith("100", req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Inventory updated successfully",
        data: updatedInventory,
      });
    });

    it("should return 404 if inventory not found", async () => {
      Inventory.update.mockResolvedValue(null);

      await inventoryController.updateInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Inventory not found",
      });
    });
  });

  describe("deleteInventory", () => {
    beforeEach(() => {
      req.params = { productId: "100" };
    });

    it("should delete inventory successfully", async () => {
      Inventory.findByProductId.mockResolvedValue(sampleInventory);
      Inventory.delete.mockResolvedValue(sampleInventory);

      await inventoryController.deleteInventory(req, res);

      expect(Inventory.delete).toHaveBeenCalledWith("100");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Inventory deleted successfully",
      });
    });

    it("should return 404 if inventory not found", async () => {
      Inventory.findByProductId.mockResolvedValue(null);

      await inventoryController.deleteInventory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
