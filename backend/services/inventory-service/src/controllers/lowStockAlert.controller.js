const db = require("../config/database");
const logger = require("../config/logger");

class LowStockAlertController {
  // Get active low stock alerts
  async getLowStockAlerts(req, res) {
    try {
      const { status = "active" } = req.query;

      console.log("=== GET LOW STOCK ALERTS ===");
      console.log("Status filter:", status);

      const result = await db.query(
        `SELECT 
          lsa.*,
          i.warehouse_location,
          i.reorder_level
         FROM low_stock_alerts lsa
         JOIN inventory i ON i.product_id = lsa.product_id
         WHERE lsa.status = $1
         ORDER BY lsa.alerted_at DESC`,
        [status]
      );

      console.log("Alerts found:", result.rows.length);
      console.log("Alerts:", JSON.stringify(result.rows, null, 2));

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      console.error("Get low stock alerts error:", error);
      logger.error("Get low stock alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching low stock alerts",
        error: error.message,
      });
    }
  }

  // Check and create alerts for low stock items
  async checkLowStock(req, res) {
    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      console.log("=== CHECKING LOW STOCK ===");

      // Find inventory items below reorder level
      const lowStockItems = await client.query(
        `SELECT 
          i.product_id,
          i.sku,
          i.available_quantity as current_quantity,
          i.reorder_level
         FROM inventory i
         WHERE i.available_quantity <= i.reorder_level`
      );

      console.log("Low stock items found:", lowStockItems.rows.length);
      console.log("Items:", JSON.stringify(lowStockItems.rows, null, 2));

      // Check for existing active alerts
      const existingAlerts = await client.query(
        `SELECT product_id FROM low_stock_alerts WHERE status = 'active'`
      );

      console.log("Existing active alerts:", existingAlerts.rows.length);
      console.log(
        "Existing alert product IDs:",
        existingAlerts.rows.map((a) => a.product_id)
      );

      // Filter out items that already have active alerts
      const existingProductIds = new Set(
        existingAlerts.rows.map((a) => a.product_id)
      );
      const itemsToAlert = lowStockItems.rows.filter(
        (item) => !existingProductIds.has(item.product_id)
      );

      console.log("Items to create alerts for:", itemsToAlert.length);

      // Create alerts for each low stock item
      const alerts = [];
      for (const item of itemsToAlert) {
        console.log(
          `Creating alert for product ${item.product_id}, SKU: ${item.sku}`
        );
        const alertResult = await client.query(
          `INSERT INTO low_stock_alerts 
           (product_id, sku, current_quantity, reorder_level, status)
           VALUES ($1, $2, $3, $4, 'active')
           RETURNING *`,
          [item.product_id, item.sku, item.current_quantity, item.reorder_level]
        );
        alerts.push(alertResult.rows[0]);
      }

      await client.query("COMMIT");

      console.log(`=== CREATED ${alerts.length} NEW LOW STOCK ALERTS ===`);
      logger.info(`Created ${alerts.length} new low stock alerts`);

      res.json({
        success: true,
        message: `Found ${alerts.length} low stock items`,
        data: alerts,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Check low stock error:", error);
      logger.error("Check low stock error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking low stock",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }

  // Resolve alert (mark as resolved)
  async resolveAlert(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await db.query(
        `UPDATE low_stock_alerts
         SET status = 'resolved',
             resolved_at = CURRENT_TIMESTAMP,
             resolved_by = $2
         WHERE id = $1
         RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      logger.info(`Low stock alert ${id} resolved by user ${userId}`);

      res.json({
        success: true,
        message: "Alert resolved successfully",
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Resolve alert error:", error);
      res.status(500).json({
        success: false,
        message: "Error resolving alert",
        error: error.message,
      });
    }
  }

  // Get reorder suggestions
  async getReorderSuggestions(req, res) {
    try {
      const result = await db.query(
        `SELECT 
          i.product_id,
          i.sku,
          i.quantity as current_quantity,
          i.reorder_level,
          i.max_stock_level,
          (i.max_stock_level - i.quantity) as suggested_order_quantity,
          i.warehouse_location
         FROM inventory i
         WHERE i.quantity <= i.reorder_level
         ORDER BY (i.reorder_level - i.quantity) DESC
         LIMIT 50`
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      logger.error("Get reorder suggestions error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching reorder suggestions",
        error: error.message,
      });
    }
  }

  // Get alert statistics
  async getAlertStats(req, res) {
    try {
      const result = await db.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_alerts,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved_alerts,
          COUNT(*) FILTER (WHERE status = 'ignored') as ignored_alerts,
          COUNT(*) as total_alerts
         FROM low_stock_alerts
         WHERE alerted_at >= CURRENT_DATE - INTERVAL '30 days'`
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Get alert stats error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching alert statistics",
        error: error.message,
      });
    }
  }
}

module.exports = new LowStockAlertController();
