/**
 * Supplier Controller Tests
 */

const SupplierController = require("../../src/controllers/supplier.controller");
const Supplier = require("../../src/models/supplier.model");
const {
  mockRequest,
  mockResponse,
  sampleSupplier,
} = require("../utils/testHelpers");

jest.mock("../../src/models/supplier.model");
jest.mock("../../src/config/logger");

describe("SupplierController", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new SupplierController();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createSupplier", () => {
    beforeEach(() => {
      req.body = {
        name: "Test Supplier Inc.",
        contact_person: "John Doe",
        email: "contact@testsupplier.com",
        phone: "+1-555-0100",
        address: "123 Supplier St",
        city: "Supply City",
        country: "USA",
      };
    });

    it("should create supplier successfully", async () => {
      Supplier.create.mockResolvedValue(sampleSupplier);

      await controller.createSupplier(req, res);

      expect(Supplier.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Supplier created successfully",
        data: sampleSupplier,
      });
    });

    it("should handle duplicate email errors", async () => {
      Supplier.create.mockRejectedValue(
        new Error("duplicate key value violates unique constraint")
      );

      await controller.createSupplier(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getAllSuppliers", () => {
    it("should get all suppliers successfully", async () => {
      const suppliers = [sampleSupplier, { ...sampleSupplier, id: 11 }];
      Supplier.findAll.mockResolvedValue(suppliers);

      await controller.getAllSuppliers(req, res);

      expect(Supplier.findAll).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: suppliers,
      });
    });

    it("should filter by is_active", async () => {
      req.query = { is_active: "true" };
      Supplier.findAll.mockResolvedValue([sampleSupplier]);

      await controller.getAllSuppliers(req, res);

      expect(Supplier.findAll).toHaveBeenCalledWith({ is_active: true });
    });

    it("should filter by country", async () => {
      req.query = { country: "USA" };
      Supplier.findAll.mockResolvedValue([sampleSupplier]);

      await controller.getAllSuppliers(req, res);

      expect(Supplier.findAll).toHaveBeenCalledWith({ country: "USA" });
    });
  });

  describe("getSupplierById", () => {
    beforeEach(() => {
      req.params = { id: "10" };
    });

    it("should get supplier by ID successfully", async () => {
      Supplier.findById.mockResolvedValue(sampleSupplier);

      await controller.getSupplierById(req, res);

      expect(Supplier.findById).toHaveBeenCalledWith("10");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sampleSupplier,
      });
    });

    it("should return 404 if supplier not found", async () => {
      Supplier.findById.mockResolvedValue(null);

      await controller.getSupplierById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Supplier not found",
      });
    });
  });

  describe("updateSupplier", () => {
    beforeEach(() => {
      req.params = { id: "10" };
      req.body = {
        name: "Updated Supplier",
        phone: "+1-555-0200",
      };
    });

    it("should update supplier successfully", async () => {
      const updatedSupplier = { ...sampleSupplier, ...req.body };
      Supplier.findById.mockResolvedValue(sampleSupplier);
      Supplier.update.mockResolvedValue(updatedSupplier);

      await controller.updateSupplier(req, res);

      expect(Supplier.update).toHaveBeenCalledWith("10", req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Supplier updated successfully",
        data: updatedSupplier,
      });
    });

    it("should return 404 if supplier not found", async () => {
      Supplier.findById.mockResolvedValue(null);

      await controller.updateSupplier(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteSupplier", () => {
    beforeEach(() => {
      req.params = { id: "10" };
    });

    it("should soft delete supplier successfully", async () => {
      Supplier.findById.mockResolvedValue(sampleSupplier);
      Supplier.softDelete.mockResolvedValue({
        ...sampleSupplier,
        is_active: false,
      });

      await controller.deleteSupplier(req, res);

      expect(Supplier.softDelete).toHaveBeenCalledWith("10");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Supplier deleted successfully",
      });
    });

    it("should return 404 if supplier not found", async () => {
      Supplier.findById.mockResolvedValue(null);

      await controller.deleteSupplier(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
