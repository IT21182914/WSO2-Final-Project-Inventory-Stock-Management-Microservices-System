/**
 * Product Controller Tests
 */

const ProductController = require("../../src/controllers/product.controller");
const Product = require("../../src/models/product.model");
const InventoryServiceClient = require("../../src/services/inventoryService.client");
const {
  mockRequest,
  mockResponse,
  sampleProduct,
} = require("../utils/testHelpers");

jest.mock("../../src/models/product.model");
jest.mock("../../src/services/inventoryService.client");
jest.mock("../../src/config/logger");

describe("ProductController", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ProductController();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    beforeEach(() => {
      req.body = {
        sku: "TEST-SKU-001",
        name: "Test Product",
        description: "Test Description",
        category_id: 1,
        size: "M",
        color: "Blue",
        unit_price: 99.99,
        supplier_id: 10,
        attributes: { material: "cotton" },
      };
    });

    it("should create product successfully", async () => {
      Product.create.mockResolvedValue(sampleProduct);
      InventoryServiceClient.createInventoryForProduct.mockResolvedValue({});

      await controller.createProduct(req, res);

      expect(Product.create).toHaveBeenCalledWith(req.body);
      expect(
        InventoryServiceClient.createInventoryForProduct
      ).toHaveBeenCalledWith(sampleProduct);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Product created successfully",
        data: sampleProduct,
      });
    });

    it("should create product even if inventory creation fails", async () => {
      Product.create.mockResolvedValue(sampleProduct);
      InventoryServiceClient.createInventoryForProduct.mockRejectedValue(
        new Error("Inventory service unavailable")
      );

      await controller.createProduct(req, res);

      expect(Product.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle product creation errors", async () => {
      Product.create.mockRejectedValue(new Error("Database error"));

      await controller.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error creating product",
        error: "Database error",
      });
    });
  });

  describe("getAllProducts", () => {
    it("should get all products successfully", async () => {
      const products = [sampleProduct, { ...sampleProduct, id: 101 }];
      Product.findAll.mockResolvedValue(products);

      await controller.getAllProducts(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: products,
      });
    });

    it("should filter by category_id", async () => {
      req.query = { category_id: "1" };
      Product.findAll.mockResolvedValue([sampleProduct]);

      await controller.getAllProducts(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({ category_id: 1 });
    });

    it("should filter by is_active", async () => {
      req.query = { is_active: "true" };
      Product.findAll.mockResolvedValue([sampleProduct]);

      await controller.getAllProducts(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({ is_active: true });
    });

    it("should filter by search term", async () => {
      req.query = { search: "test" };
      Product.findAll.mockResolvedValue([sampleProduct]);

      await controller.getAllProducts(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({ search: "test" });
    });

    it("should filter by supplier_id", async () => {
      req.query = { supplier_id: "10" };
      Product.findAll.mockResolvedValue([sampleProduct]);

      await controller.getAllProducts(req, res);

      expect(Product.findAll).toHaveBeenCalledWith({ supplier_id: 10 });
    });

    it("should handle errors", async () => {
      Product.findAll.mockRejectedValue(new Error("Database error"));

      await controller.getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching products",
        error: "Database error",
      });
    });
  });

  describe("getProductById", () => {
    beforeEach(() => {
      req.params = { id: "100" };
    });

    it("should get product by ID successfully", async () => {
      Product.findById.mockResolvedValue(sampleProduct);

      await controller.getProductById(req, res);

      expect(Product.findById).toHaveBeenCalledWith("100");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sampleProduct,
      });
    });

    it("should return 404 if product not found", async () => {
      Product.findById.mockResolvedValue(null);

      await controller.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found",
      });
    });
  });

  describe("updateProduct", () => {
    beforeEach(() => {
      req.params = { id: "100" };
      req.body = {
        name: "Updated Product",
        unit_price: 149.99,
        description: "Updated description",
      };
    });

    it("should update product successfully", async () => {
      const updatedProduct = { ...sampleProduct, ...req.body };
      Product.findById.mockResolvedValue(sampleProduct);
      Product.update.mockResolvedValue(updatedProduct);

      await controller.updateProduct(req, res);

      expect(Product.update).toHaveBeenCalledWith("100", req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    });

    it("should return 404 if product not found", async () => {
      Product.findById.mockResolvedValue(null);

      await controller.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found",
      });
    });
  });

  describe("deleteProduct", () => {
    beforeEach(() => {
      req.params = { id: "100" };
    });

    it("should soft delete product successfully", async () => {
      Product.findById.mockResolvedValue(sampleProduct);
      Product.softDelete.mockResolvedValue({
        ...sampleProduct,
        is_active: false,
      });

      await controller.deleteProduct(req, res);

      expect(Product.softDelete).toHaveBeenCalledWith("100");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Product deleted successfully",
      });
    });

    it("should return 404 if product not found", async () => {
      Product.findById.mockResolvedValue(null);

      await controller.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
