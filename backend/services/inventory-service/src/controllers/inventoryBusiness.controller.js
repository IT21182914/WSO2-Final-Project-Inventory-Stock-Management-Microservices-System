const InventoryService = require("../services/inventory.service");
const logger = require("../config/logger");

class InventoryBusinessController {
  /**
   * Bulk stock availability check
   */
  async bulkStockCheck(req, res) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: "Items array is required",
        });
      }

      const result = await InventoryService.bulkStockCheck(items);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in bulk stock check:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(req, res) {
    try {
      const { product_id, quantity, order_id } = req.body;

      if (!product_id || !quantity || !order_id) {
        return res.status(400).json({
          success: false,
          message: "product_id, quantity, and order_id are required",
        });
      }

      const inventory = await InventoryService.reserveStock(
        product_id,
        quantity,
        order_id
      );

      res.json({
        success: true,
        message: "Stock reserved successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error reserving stock:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Release reserved stock (cancelled order)
   */
  async releaseStock(req, res) {
    try {
      const { product_id, quantity, order_id } = req.body;

      if (!product_id || !quantity || !order_id) {
        return res.status(400).json({
          success: false,
          message: "product_id, quantity, and order_id are required",
        });
      }

      const inventory = await InventoryService.releaseReservedStock(
        product_id,
        quantity,
        order_id
      );

      res.json({
        success: true,
        message: "Stock released successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error releasing stock:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Confirm stock deduction (order shipped)
   */
  async confirmDeduction(req, res) {
    try {
      const { product_id, quantity, order_id } = req.body;

      if (!product_id || !quantity || !order_id) {
        return res.status(400).json({
          success: false,
          message: "product_id, quantity, and order_id are required",
        });
      }

      const inventory = await InventoryService.confirmStockDeduction(
        product_id,
        quantity,
        order_id
      );

      res.json({
        success: true,
        message: "Stock deducted successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error confirming stock deduction:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Return stock to inventory
   */
  async returnStock(req, res) {
    try {
      const { product_id, quantity, order_id } = req.body;

      if (!product_id || !quantity || !order_id) {
        return res.status(400).json({
          success: false,
          message: "product_id, quantity, and order_id are required",
        });
      }

      const inventory = await InventoryService.receiveStock(
        product_id,
        quantity,
        order_id,
        `Stock returned from order #${order_id}`
      );

      res.json({
        success: true,
        message: "Stock returned successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error returning stock:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Receive stock from supplier
   */
  async receiveStock(req, res) {
    try {
      const { product_id, quantity, supplier_order_id, notes } = req.body;

      if (!product_id || !quantity || !supplier_order_id) {
        return res.status(400).json({
          success: false,
          message: "product_id, quantity, and supplier_order_id are required",
        });
      }

      const inventory = await InventoryService.receiveStock(
        product_id,
        quantity,
        supplier_order_id,
        notes
      );

      res.json({
        success: true,
        message: "Stock received successfully",
        data: inventory,
      });
    } catch (error) {
      logger.error("Error receiving stock:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(req, res) {
    try {
      const { status = "active" } = req.query;

      console.log("=== GET LOW STOCK ALERTS (Business Controller) ===");
      console.log("Status filter:", status);

      const query = `
        SELECT 
          lsa.*,
          i.warehouse_location,
          i.quantity as actual_quantity,
          i.reserved_quantity,
          i.available_quantity
        FROM low_stock_alerts lsa
        JOIN inventory i ON i.product_id = lsa.product_id
        WHERE lsa.status = $1
        ORDER BY lsa.alerted_at DESC
      `;

      const db = require("../config/database");
      const result = await db.query(query, [status]);

      console.log("Alerts found:", result.rows.length);
      console.log("Alerts data:", JSON.stringify(result.rows, null, 2));

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Error getting low stock alerts:", error);
      logger.error("Error getting low stock alerts:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get reorder suggestions
   */
  async getReorderSuggestions(req, res) {
    try {
      const { status = "pending" } = req.query;

      const query = `
        SELECT * FROM reorder_suggestions
        WHERE status = $1
        ORDER BY created_at DESC
      `;

      const db = require("../config/database");
      const result = await db.query(query, [status]);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      logger.error("Error getting reorder suggestions:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get inventory analytics
   */
  async getAnalytics(req, res) {
    try {
      const analytics = await InventoryService.getInventoryAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error("Error getting inventory analytics:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get stock history for a product
   */
  async getStockHistory(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 50 } = req.query;

      const history = await InventoryService.getStockHistory(
        productId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error("Error getting stock history:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new InventoryBusinessController();
