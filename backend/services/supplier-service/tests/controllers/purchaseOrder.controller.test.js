/**
 * Purchase Order Controller Tests
 */

const PurchaseOrderController = require("../../src/controllers/purchaseOrder.controller");
const PurchaseOrder = require("../../src/models/purchaseOrder.model");
const {
  mockRequest,
  mockResponse,
  samplePurchaseOrder,
} = require("../utils/testHelpers");

jest.mock("../../src/models/purchaseOrder.model");
jest.mock("../../src/config/logger");

describe("PurchaseOrderController", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new PurchaseOrderController();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createPurchaseOrder", () => {
    beforeEach(() => {
      req.body = {
        supplier_id: 10,
        expected_delivery_date: "2024-01-15",
        notes: "Test PO",
        items: [{ product_id: 100, quantity: 50, unit_price: 20.0 }],
      };
      req.user = { id: 1 };
    });

    it("should create purchase order successfully", async () => {
      PurchaseOrder.create.mockResolvedValue(samplePurchaseOrder);

      await controller.createPurchaseOrder(req, res);

      expect(PurchaseOrder.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Purchase order created successfully",
        data: samplePurchaseOrder,
      });
    });

    it("should return 400 if items missing", async () => {
      req.body.items = [];

      await controller.createPurchaseOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllPurchaseOrders", () => {
    it("should get all purchase orders", async () => {
      const orders = [samplePurchaseOrder];
      PurchaseOrder.findAll.mockResolvedValue(orders);

      await controller.getAllPurchaseOrders(req, res);

      expect(PurchaseOrder.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: orders,
      });
    });

    it("should filter by supplier_id", async () => {
      req.query = { supplier_id: "10" };
      PurchaseOrder.findAll.mockResolvedValue([samplePurchaseOrder]);

      await controller.getAllPurchaseOrders(req, res);

      expect(PurchaseOrder.findAll).toHaveBeenCalledWith({ supplier_id: 10 });
    });

    it("should filter by status", async () => {
      req.query = { status: "pending" };
      PurchaseOrder.findAll.mockResolvedValue([samplePurchaseOrder]);

      await controller.getAllPurchaseOrders(req, res);

      expect(PurchaseOrder.findAll).toHaveBeenCalledWith({ status: "pending" });
    });
  });

  describe("updatePurchaseOrderStatus", () => {
    beforeEach(() => {
      req.params = { id: "1" };
      req.body = { status: "confirmed" };
    });

    it("should update status successfully", async () => {
      PurchaseOrder.findById.mockResolvedValue(samplePurchaseOrder);
      PurchaseOrder.updateStatus.mockResolvedValue({
        ...samplePurchaseOrder,
        status: "confirmed",
      });

      await controller.updatePurchaseOrderStatus(req, res);

      expect(PurchaseOrder.updateStatus).toHaveBeenCalledWith("1", "confirmed");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Purchase order status updated successfully",
        data: expect.objectContaining({ status: "confirmed" }),
      });
    });

    it("should return 404 if PO not found", async () => {
      PurchaseOrder.findById.mockResolvedValue(null);

      await controller.updatePurchaseOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
