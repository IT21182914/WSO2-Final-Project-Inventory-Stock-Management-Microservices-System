/**
 * Order Model Tests
 */

const Order = require("../../src/models/order.model");
const db = require("../../src/config/database");
const { mockQueryResult, sampleOrder } = require("../utils/testHelpers");

jest.mock("../../src/config/database");
jest.mock("../../src/config/logger");

describe("Order Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create order successfully", async () => {
      const orderData = {
        customer_id: 100,
        order_number: "ORD-20240101-001",
        status: "pending",
        total_amount: 299.97,
        shipping_address: "123 Test St",
        payment_method: "credit_card",
        payment_status: "pending",
      };

      db.query.mockResolvedValue(mockQueryResult([sampleOrder]));

      const result = await Order.create(orderData);

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(sampleOrder);
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("INSERT INTO orders");
    });

    it("should throw error on database failure", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(Order.create({ customer_id: 100 })).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findAll", () => {
    it("should find all orders", async () => {
      const orders = [sampleOrder, { ...sampleOrder, id: 2 }];
      db.query.mockResolvedValue(mockQueryResult(orders));

      const result = await Order.findAll();

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(orders);
      expect(result).toHaveLength(2);
    });

    it("should filter by status", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleOrder]));

      await Order.findAll({ status: "pending" });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("status = $");
      expect(queryCall[1]).toContain("pending");
    });

    it("should filter by customer_id", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleOrder]));

      await Order.findAll({ customer_id: 100 });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("customer_id = $");
      expect(queryCall[1]).toContain(100);
    });

    it("should apply limit", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleOrder]));

      await Order.findAll({ limit: 10 });

      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("LIMIT");
    });
  });

  describe("findById", () => {
    it("should find order by ID", async () => {
      db.query.mockResolvedValue(mockQueryResult([sampleOrder]));

      const result = await Order.findById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE o.id = $1"),
        [1]
      );
      expect(result).toEqual(sampleOrder);
    });

    it("should return undefined if not found", async () => {
      db.query.mockResolvedValue(mockQueryResult([]));

      const result = await Order.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe("updateStatus", () => {
    it("should update order status", async () => {
      const updatedOrder = { ...sampleOrder, status: "confirmed" };
      db.query.mockResolvedValue(mockQueryResult([updatedOrder]));

      const result = await Order.updateStatus(1, "confirmed");

      expect(db.query).toHaveBeenCalled();
      expect(result.status).toBe("confirmed");
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain("UPDATE orders");
      expect(queryCall[0]).toContain("status =");
    });
  });

  describe("delete", () => {
    it("should delete order", async () => {
      db.query.mockResolvedValue({ rowCount: 1 });

      const result = await Order.delete(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM orders"),
        [1]
      );
      expect(result).toBe(true);
    });

    it("should return false if not found", async () => {
      db.query.mockResolvedValue({ rowCount: 0 });

      const result = await Order.delete(999);

      expect(result).toBe(false);
    });
  });
});
