const PurchaseOrder = require("../models/purchaseOrder.model");
const ProductSupplier = require("../models/productSupplier.model");
const logger = require("../config/logger");
const axios = require("axios");

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:3003";

class PurchaseOrderController {
  async createPurchaseOrder(req, res) {
    try {
      const { supplier_id, product_id, requested_quantity } = req.body;

      // Validate that this supplier can provide this product
      const productSupplier = await ProductSupplier.findOne(
        product_id,
        supplier_id
      );

      if (!productSupplier) {
        logger.warn(
          `Supplier ${supplier_id} cannot provide product ${product_id}`
        );
        return res.status(400).json({
          success: false,
          message: "This supplier cannot provide the selected product",
        });
      }

      if (!productSupplier.is_active) {
        return res.status(400).json({
          success: false,
          message: "This product-supplier relationship is not active",
        });
      }

      // Check minimum order quantity
      if (requested_quantity < productSupplier.minimum_order_quantity) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for this product from this supplier is ${productSupplier.minimum_order_quantity}`,
        });
      }

      const purchaseOrder = await PurchaseOrder.create(req.body);

      logger.info(`Purchase order ${purchaseOrder.id} created successfully`);

      res.status(201).json({
        success: true,
        message: "Purchase order created successfully",
        data: purchaseOrder,
      });
    } catch (error) {
      logger.error("Create purchase order error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating purchase order",
        error: error.message,
      });
    }
  }

  async getAllPurchaseOrders(req, res) {
    try {
      const { status, supplier_id, limit } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (supplier_id) filters.supplier_id = parseInt(supplier_id);
      if (limit) filters.limit = parseInt(limit);

      logger.info("🔍 Fetching purchase orders with filters:", filters);

      const purchaseOrders = await PurchaseOrder.findAll(filters);

      logger.info(`📦 Found ${purchaseOrders.length} purchase orders`);

      // Enrich with product details
      const enrichedOrders = await Promise.all(
        purchaseOrders.map(async (order, index) => {
          logger.info(
            `🔍 Processing order ${index + 1}/${purchaseOrders.length}:`,
            {
              id: order.id,
              po_number: order.po_number,
              product_id: order.product_id,
            }
          );

          if (order.product_id) {
            try {
              const productUrl = `${
                process.env.PRODUCT_SERVICE_URL ||
                "http://product-catalog-service:3002"
              }/api/products/${order.product_id}`;

              logger.info(`🌐 Fetching product from: ${productUrl}`);

              const productResponse = await axios.get(productUrl);

              logger.info(`✅ Product fetched successfully:`, {
                product_id: order.product_id,
                product_name: productResponse.data.data?.name,
                product_sku: productResponse.data.data?.sku,
              });

              // Fetch supplier price from product_suppliers table
              let supplierPrice = null;
              if (order.supplier_id) {
                try {
                  const productSupplier = await ProductSupplier.findOne(
                    order.product_id,
                    order.supplier_id
                  );
                  if (productSupplier) {
                    supplierPrice = productSupplier.supplier_unit_price;
                    logger.info(`💰 Supplier price found: $${supplierPrice}`);
                  }
                } catch (priceError) {
                  logger.warn(
                    `⚠️ Failed to fetch supplier price:`,
                    priceError.message
                  );
                }
              }

              return {
                ...order,
                product_details: productResponse.data.data || null,
                supplier_price: supplierPrice,
              };
            } catch (error) {
              logger.warn(
                `❌ Failed to fetch product ${order.product_id}:`,
                error.message
              );
              return order;
            }
          } else {
            logger.warn(`⚠️ Order ${order.id} has no product_id`);
          }
          return order;
        })
      );

      logger.info(
        `✅ Retrieved ${enrichedOrders.length} enriched purchase orders`
      );

      // Log sample of enriched data
      if (enrichedOrders.length > 0) {
        logger.info("📊 Sample enriched order:", {
          id: enrichedOrders[0].id,
          po_number: enrichedOrders[0].po_number,
          product_id: enrichedOrders[0].product_id,
          has_product_details: !!enrichedOrders[0].product_details,
          product_details: enrichedOrders[0].product_details,
        });
      }

      res.json({
        success: true,
        count: enrichedOrders.length,
        data: enrichedOrders,
      });
    } catch (error) {
      logger.error("❌ Get all purchase orders error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching purchase orders",
        error: error.message,
      });
    }
  }

  async getPurchaseOrderById(req, res) {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.findById(id);

      if (!purchaseOrder) {
        logger.warn(`Purchase order ${id} not found`);
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      logger.info(`Retrieved purchase order ${id}`);

      res.json({
        success: true,
        data: purchaseOrder,
      });
    } catch (error) {
      logger.error(`Get purchase order ${req.params.id} error:`, error);
      res.status(500).json({
        success: false,
        message: "Error fetching purchase order",
        error: error.message,
      });
    }
  }

  async updatePurchaseOrder(req, res) {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.update(id, req.body);

      if (!purchaseOrder) {
        logger.warn(`Purchase order ${id} not found for update`);
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      logger.info(`Purchase order ${id} updated successfully`);

      res.json({
        success: true,
        message: "Purchase order updated successfully",
        data: purchaseOrder,
      });
    } catch (error) {
      logger.error(`Update purchase order ${req.params.id} error:`, error);
      res.status(500).json({
        success: false,
        message: "Error updating purchase order",
        error: error.message,
      });
    }
  }

  async updatePurchaseOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "approved",
        "ordered",
        "received",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        logger.warn(`Invalid status ${status} for purchase order ${id}`);
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      const purchaseOrder = await PurchaseOrder.updateStatus(id, status);

      if (!purchaseOrder) {
        logger.warn(`Purchase order ${id} not found for status update`);
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      logger.info(`Purchase order ${id} status updated to ${status}`);

      res.json({
        success: true,
        message: "Purchase order status updated successfully",
        data: purchaseOrder,
      });
    } catch (error) {
      logger.error(
        `Update purchase order ${req.params.id} status error:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Error updating purchase order status",
        error: error.message,
      });
    }
  }

  async deletePurchaseOrder(req, res) {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.delete(id);

      if (!purchaseOrder) {
        logger.warn(`Purchase order ${id} not found for deletion`);
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      logger.info(`Purchase order ${id} deleted successfully`);

      res.json({
        success: true,
        message: "Purchase order deleted successfully",
        data: purchaseOrder,
      });
    } catch (error) {
      logger.error(`Delete purchase order ${req.params.id} error:`, error);
      res.status(500).json({
        success: false,
        message: "Error deleting purchase order",
        error: error.message,
      });
    }
  }

  async getPurchaseOrderStats(req, res) {
    try {
      const { supplier_id } = req.query;
      const filters = {};
      if (supplier_id) filters.supplier_id = parseInt(supplier_id);

      const allOrders = await PurchaseOrder.findAll(filters);

      const stats = {
        total: allOrders.length,
        pending: allOrders.filter((o) => o.status === "pending").length,
        approved: allOrders.filter((o) => o.status === "approved").length,
        ordered: allOrders.filter((o) => o.status === "ordered").length,
        received: allOrders.filter((o) => o.status === "received").length,
        cancelled: allOrders.filter((o) => o.status === "cancelled").length,
        totalAmount: allOrders.reduce(
          (sum, o) => sum + parseFloat(o.total_amount || 0),
          0
        ),
      };

      logger.info("Purchase order stats retrieved", stats);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Get purchase order stats error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching purchase order statistics",
        error: error.message,
      });
    }
  }

  // New: Supplier responds to purchase request (approve/reject)
  async respondToPurchaseRequest(req, res) {
    try {
      const { id } = req.params;
      const {
        response,
        approved_quantity,
        rejection_reason,
        estimated_delivery_date,
        supplier_notes,
      } = req.body;

      // Validate response
      if (!["approved", "rejected", "partially_approved"].includes(response)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid response. Must be 'approved', 'rejected', or 'partially_approved'",
        });
      }

      const updateData = {
        supplier_response: response,
        responded_at: new Date(),
        supplier_notes,
      };

      if (response === "approved" || response === "partially_approved") {
        updateData.approved_quantity = approved_quantity;
        updateData.estimated_delivery_date = estimated_delivery_date;
        updateData.status = "confirmed";
      } else if (response === "rejected") {
        updateData.rejection_reason = rejection_reason;
        updateData.status = "rejected";
      }

      const updatedPO = await PurchaseOrder.update(id, updateData);

      logger.info(`Purchase order ${id} ${response} by supplier`);

      res.json({
        success: true,
        message: `Purchase request ${response} successfully`,
        data: updatedPO,
      });
    } catch (error) {
      logger.error("Respond to purchase request error:", error);
      res.status(500).json({
        success: false,
        message: "Error responding to purchase request",
        error: error.message,
      });
    }
  }

  // New: Supplier marks order as preparing
  async markOrderPreparing(req, res) {
    try {
      const { id } = req.params;

      const updateData = { status: "preparing" };
      const updatedPO = await PurchaseOrder.update(id, updateData);

      logger.info(`Purchase order ${id} marked as preparing`);

      res.json({
        success: true,
        message: "Order marked as preparing",
        data: updatedPO,
      });
    } catch (error) {
      logger.error("Mark order preparing error:", error);
      res.status(500).json({
        success: false,
        message: "Error marking order as preparing",
        error: error.message,
      });
    }
  }

  // New: Supplier updates shipment status
  async updateShipmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, tracking_number, actual_delivery_date } = req.body;

      const updateData = { status };
      if (tracking_number) updateData.tracking_number = tracking_number;
      if (actual_delivery_date)
        updateData.actual_delivery_date = actual_delivery_date;

      const updatedPO = await PurchaseOrder.update(id, updateData);

      logger.info(`Purchase order ${id} shipment status updated to ${status}`);

      res.json({
        success: true,
        message: "Shipment status updated successfully",
        data: updatedPO,
      });
    } catch (error) {
      logger.error("Update shipment status error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating shipment status",
        error: error.message,
      });
    }
  }

  // New: Warehouse confirms receipt
  async confirmReceipt(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Get the purchase order first
      const purchaseOrder = await PurchaseOrder.findById(id);
      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found",
        });
      }

      // Get purchase order items
      const db = require("../config/database");
      const itemsResult = await db.query(
        "SELECT product_id, sku, quantity FROM purchase_order_items WHERE po_id = $1",
        [id]
      );

      const updateData = {
        status: "received",
        actual_delivery_date: new Date(),
        notes: notes || "",
      };

      const updatedPO = await PurchaseOrder.update(id, updateData);

      // Update inventory for each product
      let inventoryUpdatesSuccessful = true;
      const inventoryErrors = [];

      for (const item of itemsResult.rows) {
        try {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/adjust`, {
            product_id: item.product_id,
            sku: item.sku,
            quantity: item.quantity,
            movement_type: "in",
            notes: `Received from PO ${purchaseOrder.po_number}`,
          });
          logger.info(
            `Inventory updated for product ${item.product_id}: +${item.quantity} units`
          );
        } catch (inventoryError) {
          inventoryUpdatesSuccessful = false;
          inventoryErrors.push({
            product_id: item.product_id,
            error: inventoryError.message,
          });
          logger.error(
            `Failed to update inventory for product ${item.product_id}:`,
            inventoryError
          );
        }
      }

      logger.info(`Purchase order ${id} marked as received`);

      res.json({
        success: true,
        message: "Purchase order receipt confirmed",
        data: updatedPO,
        inventory_updates: {
          successful: inventoryUpdatesSuccessful,
          errors: inventoryErrors.length > 0 ? inventoryErrors : undefined,
        },
      });
    } catch (error) {
      logger.error("Confirm receipt error:", error);
      res.status(500).json({
        success: false,
        message: "Error confirming receipt",
        error: error.message,
      });
    }
  }

  // New: Get pending requests for supplier
  async getSupplierPendingRequests(req, res) {
    try {
      const { supplier_id } = req.params;

      const pendingRequests = await PurchaseOrder.findAll({
        supplier_id: parseInt(supplier_id),
        supplier_response: "pending",
      });

      res.json({
        success: true,
        count: pendingRequests.length,
        data: pendingRequests,
      });
    } catch (error) {
      logger.error("Get supplier pending requests error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching pending requests",
        error: error.message,
      });
    }
  }
}

module.exports = new PurchaseOrderController();
