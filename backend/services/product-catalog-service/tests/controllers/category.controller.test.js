/**
 * Category Controller Tests
 */

const CategoryController = require("../../src/controllers/category.controller");
const Category = require("../../src/models/category.model");
const {
  mockRequest,
  mockResponse,
  sampleCategory,
} = require("../utils/testHelpers");

jest.mock("../../src/models/category.model");
jest.mock("../../src/config/logger");

describe("CategoryController", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new CategoryController();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createCategory", () => {
    beforeEach(() => {
      req.body = {
        name: "Electronics",
        description: "Electronic products",
        parent_id: null,
      };
    });

    it("should create category successfully", async () => {
      Category.create.mockResolvedValue(sampleCategory);

      await controller.createCategory(req, res);

      expect(Category.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Category created successfully",
        data: sampleCategory,
      });
    });

    it("should validate parent category exists", async () => {
      req.body.parent_id = 999;
      Category.findById.mockResolvedValue(null);

      await controller.createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Parent category not found",
      });
    });
  });

  describe("getAllCategories", () => {
    it("should get all categories", async () => {
      const categories = [sampleCategory, { ...sampleCategory, id: 2 }];
      Category.findAll.mockResolvedValue(categories);

      await controller.getAllCategories(req, res);

      expect(Category.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: categories,
      });
    });

    it("should get root categories only", async () => {
      req.query = { parent_id: "null" };
      Category.findAll.mockResolvedValue([sampleCategory]);

      await controller.getAllCategories(req, res);

      expect(Category.findAll).toHaveBeenCalledWith({ parent_id: null });
    });
  });

  describe("getCategoryById", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("should get category by ID", async () => {
      Category.findById.mockResolvedValue(sampleCategory);

      await controller.getCategoryById(req, res);

      expect(Category.findById).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sampleCategory,
      });
    });

    it("should return 404 if not found", async () => {
      Category.findById.mockResolvedValue(null);

      await controller.getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
