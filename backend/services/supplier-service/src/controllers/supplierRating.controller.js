const db = require("../config/database");
const logger = require("../config/logger");

class SupplierRatingController {
  async createRating(req, res) {
    try {
      const { supplier_id } = req.params;
      const {
        purchase_order_id,
        rating,
        quality_rating,
        delivery_rating,
        communication_rating,
        comments,
      } = req.body;

      // Get user ID from Asgardeo token (sub claim)
      const rated_by = req.user?.sub || req.user?.id || req.user?.userId;

      if (!rated_by) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      // Verify PO exists and is completed
      const poCheck = await db.query(
        "SELECT id, status, supplier_id FROM purchase_orders WHERE id = $1",
        [purchase_order_id]
      );

      if (poCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      if (poCheck.rows[0].status !== "received") {
        return res.status(400).json({
          success: false,
          message: "Can only rate completed (received) orders",
        });
      }

      if (poCheck.rows[0].supplier_id !== parseInt(supplier_id)) {
        return res.status(400).json({
          success: false,
          message: "Purchase order does not belong to this supplier",
        });
      }

      // Check if already rated
      const existingRating = await db.query(
        "SELECT id FROM supplier_ratings WHERE purchase_order_id = $1",
        [purchase_order_id]
      );

      if (existingRating.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This purchase order has already been rated",
        });
      }

      // Insert rating
      const result = await db.query(
        `INSERT INTO supplier_ratings 
        (supplier_id, purchase_order_id, rating, quality_rating, delivery_rating, communication_rating, comments, rated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          supplier_id,
          purchase_order_id,
          rating,
          quality_rating,
          delivery_rating,
          communication_rating,
          comments,
          rated_by,
        ]
      );

      logger.info(
        `Supplier ${supplier_id} rated ${rating} stars for PO ${purchase_order_id}`
      );

      res.status(201).json({
        success: true,
        message: "Supplier rating submitted successfully",
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Create supplier rating error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating supplier rating",
        error: error.message,
      });
    }
  }

  async getSupplierRatings(req, res) {
    try {
      const { supplier_id } = req.params;
      const { limit = 10 } = req.query;

      const result = await db.query(
        `SELECT sr.*, po.po_number, po.order_date 
         FROM supplier_ratings sr
         LEFT JOIN purchase_orders po ON sr.purchase_order_id = po.id
         WHERE sr.supplier_id = $1
         ORDER BY sr.created_at DESC
         LIMIT $2`,
        [supplier_id, limit]
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      logger.error("Get supplier ratings error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching supplier ratings",
        error: error.message,
      });
    }
  }

  async getSupplierStats(req, res) {
    try {
      const { supplier_id } = req.params;

      const result = await db.query(
        `SELECT 
          COUNT(*) as total_ratings,
          ROUND(AVG(rating), 2) as average_rating,
          ROUND(AVG(quality_rating), 2) as avg_quality,
          ROUND(AVG(delivery_rating), 2) as avg_delivery,
          ROUND(AVG(communication_rating), 2) as avg_communication
         FROM supplier_ratings
         WHERE supplier_id = $1`,
        [supplier_id]
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Get supplier stats error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching supplier statistics",
        error: error.message,
      });
    }
  }

  async updateRating(req, res) {
    try {
      const { rating_id } = req.params;
      const {
        rating,
        quality_rating,
        delivery_rating,
        communication_rating,
        comments,
      } = req.body;

      const result = await db.query(
        `UPDATE supplier_ratings 
         SET rating = COALESCE($1, rating),
             quality_rating = COALESCE($2, quality_rating),
             delivery_rating = COALESCE($3, delivery_rating),
             communication_rating = COALESCE($4, communication_rating),
             comments = COALESCE($5, comments),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          rating,
          quality_rating,
          delivery_rating,
          communication_rating,
          comments,
          rating_id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Rating not found",
        });
      }

      logger.info(`Supplier rating ${rating_id} updated`);

      res.json({
        success: true,
        message: "Rating updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Update supplier rating error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating supplier rating",
        error: error.message,
      });
    }
  }

  async deleteRating(req, res) {
    try {
      const { rating_id } = req.params;

      const result = await db.query(
        "DELETE FROM supplier_ratings WHERE id = $1 RETURNING *",
        [rating_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Rating not found",
        });
      }

      logger.info(`Supplier rating ${rating_id} deleted`);

      res.json({
        success: true,
        message: "Rating deleted successfully",
        data: result.rows[0],
      });
    } catch (error) {
      logger.error("Delete supplier rating error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting supplier rating",
        error: error.message,
      });
    }
  }
}

module.exports = new SupplierRatingController();
