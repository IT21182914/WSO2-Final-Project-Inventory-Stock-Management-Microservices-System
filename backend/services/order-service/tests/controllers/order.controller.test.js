/**
 * Order Controller Tests
 */

const OrderController = require("../../src/controllers/order.controller");
const Order = require("../../src/models/order.model");
const OrderService = require("../../src/services/order.service");
const {
  mockRequest,
  mockResponse,
  sampleOrder,
  sampleOrderWithItems,
} = require("../utils/testHelpers");

jest.mock("../../src/models/order.model");
jest.mock("../../src/services/order.service");
jest.mock("../../src/config/logger");

describe("OrderController", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new OrderController();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    beforeEach(() => {
      req.body = {
        customer_id: 100,
        shipping_address: "123 Test St, Test City",
        payment_method: "credit_card",
        payment_status: "pending",
        notes: "Test order",
        items: [
          {
            product_id: 100,
            sku: "TEST-SKU-001",
            quantity: 3,
            unit_price: 99.99,
          },
        ],
      };
    });

    it("should create order successfully", async () => {
      const orderResult = {
        order: sampleOrder,
        items: [{ ...sampleOrderWithItems.items[0] }],
        totals: { subtotal: 299.97, tax: 0, total: 299.97 },
      };

      OrderService.createOrder.mockResolvedValue(orderResult);

      await controller.createOrder(req, res);

      expect(OrderService.createOrder).toHaveBeenCalledWith({
        customer_id: 100,
        shipping_address: "123 Test St, Test City",
        payment_method: "credit_card",
        payment_status: "pending",
        notes: "Test order",
        items: req.body.items,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Order created successfully",
        data: expect.objectContaining({
          id: 1,
          items: expect.any(Array),
          totals: expect.any(Object),
        }),
      });
    });

    it("should return 400 if items array is empty", async () => {
      req.body.items = [];

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Order must contain at least one item",
      });
      expect(OrderService.createOrder).not.toHaveBeenCalled();
    });

    it("should return 400 if items are missing", async () => {
      delete req.body.items;

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Order must contain at least one item",
      });
    });

    it("should handle service errors", async () => {
      OrderService.createOrder.mockRejectedValue(
        new Error("Insufficient stock")
      );

      await controller.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Insufficient stock",
        error: "Insufficient stock",
      });
    });
  });

  describe("getAllOrders", () => {
    it("should get all orders successfully", async () => {
      const orders = [sampleOrder, { ...sampleOrder, id: 2 }];
      Order.findAll.mockResolvedValue(orders);

      await controller.getAllOrders(req, res);

      expect(Order.findAll).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: orders,
      });
    });

    it("should filter by status", async () => {
      req.query = { status: "pending" };
      Order.findAll.mockResolvedValue([sampleOrder]);

      await controller.getAllOrders(req, res);

      expect(Order.findAll).toHaveBeenCalledWith({ status: "pending" });
      expect(res.json).toHaveBeenCalled();
    });

    it("should filter by customer_id", async () => {
      req.query = { customer_id: "100" };
      Order.findAll.mockResolvedValue([sampleOrder]);

      await controller.getAllOrders(req, res);

      expect(Order.findAll).toHaveBeenCalledWith({ customer_id: 100 });
    });

    it("should apply limit filter", async () => {
      req.query = { limit: "10" };
      Order.findAll.mockResolvedValue([sampleOrder]);

      await controller.getAllOrders(req, res);

      expect(Order.findAll).toHaveBeenCalledWith({ limit: 10 });
    });

    it("should handle errors", async () => {
      Order.findAll.mockRejectedValue(new Error("Database error"));

      await controller.getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching orders",
        error: "Database error",
      });
    });
  });

  describe("getOrderById", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("should get order by ID successfully", async () => {
      Order.findById.mockResolvedValue(sampleOrderWithItems);

      await controller.getOrderById(req, res);

      expect(Order.findById).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: sampleOrderWithItems,
      });
    });

    it("should return 404 if order not found", async () => {
      Order.findById.mockResolvedValue(null);

      await controller.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Order not found",
      });
    });
  });

  describe("updateOrderStatus", () => {
    beforeEach(() => {
      req.params = { id: "1" };
      req.body = { status: "confirmed" };
    });

    it("should update order status successfully", async () => {
      const updatedOrder = { ...sampleOrder, status: "confirmed" };
      Order.findById.mockResolvedValue(sampleOrder);
      Order.updateStatus.mockResolvedValue(updatedOrder);

      await controller.updateOrderStatus(req, res);

      expect(Order.updateStatus).toHaveBeenCalledWith("1", "confirmed");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      });
    });

    it("should return 404 if order not found", async () => {
      Order.findById.mockResolvedValue(null);

      await controller.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Order not found",
      });
    });

    it("should handle invalid status transitions", async () => {
      Order.findById.mockResolvedValue(sampleOrder);
      Order.updateStatus.mockRejectedValue(
        new Error("Invalid status transition")
      );

      await controller.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("cancelOrder", () => {
    beforeEach(() => {
      req.params = { id: "1" };
    });

    it("should cancel order successfully", async () => {
      Order.findById.mockResolvedValue(sampleOrder);
      OrderService.cancelOrder.mockResolvedValue({
        ...sampleOrder,
        status: "cancelled",
      });

      await controller.cancelOrder(req, res);

      expect(OrderService.cancelOrder).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Order cancelled successfully",
        data: expect.objectContaining({ status: "cancelled" }),
      });
    });

    it("should return 404 if order not found", async () => {
      Order.findById.mockResolvedValue(null);

      await controller.cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
