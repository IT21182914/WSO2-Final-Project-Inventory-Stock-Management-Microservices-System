const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const db = require("../config/database");
const logger = require("../config/logger");
const axios = require("axios");

// Service URLs
const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://inventory-service:3003";
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-catalog-service:3002";
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3001";

class OrderService {
  /**
   * Create order with full business logic workflow
   */
  static async createOrder(orderData) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // Step 1: Skip customer validation (orders created by admin/warehouse staff)
      // In production, this would validate against POS/e-commerce system
      logger.info(`Creating order for customer ${orderData.customer_id}`);

      // Step 2: Validate and enrich product data
      const enrichedItems = await this.validateAndEnrichItems(orderData.items);

      // Step 3: Check stock availability for all items
      const stockCheck = await this.checkStockAvailability(enrichedItems);

      if (!stockCheck.allAvailable) {
        throw new Error(
          `Stock not available for some items: ${JSON.stringify(
            stockCheck.unavailableItems
          )}`
        );
      }

      // Step 4: Calculate accurate totals
      const totals = this.calculateOrderTotals(enrichedItems);

      // Step 5: Create the order
      const order = await Order.create(
        {
          ...orderData,
          total_amount: totals.total,
          status: "pending",
        },
        client
      );

      // Step 6: Create order items
      const items = await OrderItem.createBatch(
        enrichedItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          sku: item.sku,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        client
      );

      // Step 7: Reserve stock in inventory service
      await this.reserveStockForOrder(order.id, enrichedItems);

      await client.query("COMMIT");

      logger.info(
        `Order ${order.id} created successfully with ${items.length} items`
      );

      // Step 8: Trigger post-order actions (async, don't wait)
      this.handlePostOrderCreation(order, items).catch((err) =>
        logger.error("Error in post-order creation:", err)
      );

      return { order, items, totals };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error creating order:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate customer exists and is active
   */
  static async validateCustomer(customerId) {
    try {
      const response = await axios.get(
        `${USER_SERVICE_URL}/api/users/${customerId}`
      );
      const user = response.data;

      if (!user) {
        throw new Error(`Customer ${customerId} not found`);
      }

      if (!user.is_active) {
        throw new Error(`Customer ${customerId} is not active`);
      }

      return user;
    } catch (error) {
      // If user service is unavailable or requires auth, skip validation
      if (error.response?.status === 401) {
        logger.warn(`Skipping customer validation - auth required`);
        return { id: customerId, is_active: true };
      }
      if (error.response?.status === 404) {
        throw new Error(`Customer ${customerId} not found`);
      }
      logger.warn(
        "Error validating customer, proceeding anyway:",
        error.message
      );
      return { id: customerId, is_active: true };
    }
  }

  /**
   * Validate items and enrich with product data
   */
  static async validateAndEnrichItems(items) {
    try {
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          // Get product details
          logger.info(
            `Fetching product details for product_id: ${item.product_id}`
          );
          const response = await axios.get(
            `${PRODUCT_SERVICE_URL}/api/products/${item.product_id}`
          );
          // Product data is nested in response.data.data
          const product = response.data.data || response.data;

          logger.info(`Product ${item.product_id} details:`, {
            id: product.id,
            name: product.name,
            sku: product.sku,
            is_active: product.is_active,
            lifecycle_state: product.lifecycle_state,
            unit_price: product.unit_price,
          });

          if (!product) {
            throw new Error(`Product ${item.product_id} not found`);
          }

          // Check if product is available for sale
          // Product must be active (is_active=true) AND in 'active' lifecycle state
          const isAvailable =
            product.is_active !== false &&
            (product.lifecycle_state === "active" ||
              product.lifecycle_state === "approved");

          if (!isAvailable) {
            logger.error(`Product ${item.product_id} validation failed:`, {
              is_active: product.is_active,
              lifecycle_state: product.lifecycle_state,
              reason: !product.is_active
                ? "is_active is false"
                : `lifecycle_state is '${product.lifecycle_state}' (must be 'active' or 'approved')`,
            });
            throw new Error(
              `Product ${item.product_id} (${product.name}) is not available for sale. Status: is_active=${product.is_active}, lifecycle_state=${product.lifecycle_state}`
            );
          }

          logger.info(
            `Product ${item.product_id} validation passed - available for sale`
          );

          // Use product data if not provided in order
          return {
            product_id: item.product_id,
            sku: item.sku || product.sku,
            product_name: item.product_name || product.name,
            quantity: item.quantity,
            unit_price: item.unit_price || product.unit_price,
            product: product, // Include full product data for reference
          };
        })
      );

      return enrichedItems;
    } catch (error) {
      logger.error("Error validating items:", error.message);
      throw error;
    }
  }

  /**
   * Check stock availability via inventory service
   */
  static async checkStockAvailability(items) {
    try {
      const stockCheckItems = items.map((item) => ({
        product_id: item.product_id,
        sku: item.sku,
        quantity: item.quantity,
      }));

      logger.info("Checking stock availability for items:", stockCheckItems);

      const response = await axios.post(
        `${INVENTORY_SERVICE_URL}/api/inventory/bulk-check`,
        { items: stockCheckItems }
      );

      logger.info("Stock check response:", {
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        hasAllAvailable: response.data?.allAvailable,
        hasUnavailableItems: response.data?.unavailableItems,
      });

      // Handle different response formats
      const stockData = response.data.data || response.data;

      logger.info("Processed stock data:", stockData);

      return stockData;
    } catch (error) {
      logger.error("Error checking stock:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error("Unable to verify stock availability");
    }
  }

  /**
   * Reserve stock for this order
   */
  static async reserveStockForOrder(orderId, items) {
    try {
      logger.info(`Attempting to reserve stock for order ${orderId}`, {
        itemCount: items.length,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      });

      const reservePromises = items.map(async (item) => {
        try {
          const response = await axios.post(
            `${INVENTORY_SERVICE_URL}/api/inventory/reserve`,
            {
              product_id: item.product_id,
              quantity: item.quantity,
              order_id: orderId,
            }
          );
          logger.info(
            `Reserved stock for product ${item.product_id}:`,
            response.data
          );
          return response;
        } catch (err) {
          logger.error(
            `Failed to reserve stock for product ${item.product_id}:`,
            {
              message: err.message,
              response: err.response?.data,
              status: err.response?.status,
            }
          );
          throw err;
        }
      });

      await Promise.all(reservePromises);

      logger.info(`Stock reserved for order ${orderId}`);
    } catch (error) {
      logger.error("Error reserving stock:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });
      throw new Error(
        `Failed to reserve stock for order: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Calculate order totals
   */
  static calculateOrderTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  /**
   * Update order status with business logic
   */
  static async updateOrderStatus(orderId, newStatus, userId = null) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      // Get current order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Validate status transition
      this.validateStatusTransition(order.status, newStatus);

      // Update status
      const updatedOrder = await Order.updateStatus(orderId, newStatus, client);

      // Handle status-specific logic
      await this.handleStatusChange(
        updatedOrder,
        order.status,
        newStatus,
        client
      );

      await client.query("COMMIT");

      logger.info(
        `Order ${orderId} status changed from ${order.status} to ${newStatus}`
      );
      return updatedOrder;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error updating order status:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate status transitions
   */
  static validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      pending: ["confirmed", "processing", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Handle status change side effects
   */
  static async handleStatusChange(order, oldStatus, newStatus, client) {
    try {
      // Get order items
      const items = await OrderItem.findByOrderId(order.id);

      switch (newStatus) {
        case "confirmed":
          // Order confirmed - keep stock reserved
          logger.info(`Order ${order.id} confirmed - stock remains reserved`);
          break;

        case "shipped":
          // When shipped, deduct actual stock
          await this.confirmStockDeduction(order.id, items);
          // TODO: Create shipping label, send tracking notification
          break;

        case "cancelled":
          // Release reserved stock
          await this.releaseStockForOrder(order.id, items);
          // TODO: Process refund if payment was made
          break;

        case "returned":
          // Return stock to inventory
          await this.returnStockForOrder(order.id, items);
          break;

        case "completed":
          // Mark order as final
          logger.info(`Order ${order.id} completed successfully`);
          // TODO: Trigger review request, loyalty points
          break;
      }

      // Log status change
      const logQuery = `
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_at, notes)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;

      await client.query(logQuery, [
        order.id,
        oldStatus,
        newStatus,
        `Status changed from ${oldStatus} to ${newStatus}`,
      ]);
    } catch (error) {
      logger.error("Error handling status change:", error.message || error);
      throw error;
    }
  }

  /**
   * Confirm stock deduction when order ships
   */
  static async confirmStockDeduction(orderId, items) {
    try {
      await Promise.all(
        items.map((item) =>
          axios.post(
            `${INVENTORY_SERVICE_URL}/api/inventory/confirm-deduction`,
            {
              product_id: item.product_id,
              quantity: item.quantity,
              order_id: orderId,
            }
          )
        )
      );

      logger.info(`Stock deducted for shipped order ${orderId}`);
    } catch (error) {
      logger.error("Error confirming stock deduction:", error.message || error);
      throw error;
    }
  }

  /**
   * Release stock when order is cancelled
   */
  static async releaseStockForOrder(orderId, items) {
    try {
      await Promise.all(
        items.map((item) =>
          axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/release`, {
            product_id: item.product_id,
            quantity: item.quantity,
            order_id: orderId,
          })
        )
      );

      logger.info(`Stock released for cancelled order ${orderId}`);
    } catch (error) {
      logger.error("Error releasing stock:", error.message || error);
      throw error;
    }
  }

  /**
   * Return stock when order is returned
   */
  static async returnStockForOrder(orderId, items) {
    try {
      await Promise.all(
        items.map((item) =>
          axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/return`, {
            product_id: item.product_id,
            quantity: item.quantity,
            order_id: orderId,
          })
        )
      );

      logger.info(`Stock returned for order ${orderId}`);
    } catch (error) {
      logger.error("Error returning stock:", error.message || error);
      throw error;
    }
  }

  /**
   * Post-order creation actions (async)
   */
  static async handlePostOrderCreation(order, items) {
    // TODO: Send order confirmation email
    // TODO: Notify warehouse for fulfillment
    // TODO: Create invoice
    // TODO: Update customer order history
    logger.info(`Post-order creation tasks initiated for order ${order.id}`);
  }

  /**
   * Get order analytics
   */
  static async getOrderAnalytics(filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_order_value,
          SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_revenue
        FROM orders
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 1;

      if (filters.start_date) {
        query += ` AND created_at >= $${paramCount}`;
        params.push(filters.start_date);
        paramCount++;
      }

      if (filters.end_date) {
        query += ` AND created_at <= $${paramCount}`;
        params.push(filters.end_date);
        paramCount++;
      }

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error("Error getting order analytics:", error);
      throw error;
    }
  }
}

module.exports = OrderService;
