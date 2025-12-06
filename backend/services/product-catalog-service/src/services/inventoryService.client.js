const axios = require("axios");
const logger = require("../config/logger");

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:3003/api";

class InventoryServiceClient {
  /**
   * Create inventory record for a new product with 0 initial stock
   */
  static async createInventoryForProduct(productData) {
    try {
      const response = await axios.post(
        `${INVENTORY_SERVICE_URL}/inventory`,
        {
          product_id: productData.id,
          sku: productData.sku,
          quantity: 0,
          warehouse_location: "Warehouse-A", // Default warehouse
          reorder_level: 100, // Default reorder level
          max_stock_level: 1000, // Default max stock
        },
        {
          timeout: 5000,
        }
      );

      logger.info(
        `Inventory created for product ${productData.id} (${productData.sku})`
      );
      return response.data.data;
    } catch (error) {
      // Log error but don't fail product creation
      logger.error(
        `Failed to create inventory for product ${productData.id}:`,
        error.message
      );
      
      // Return null to indicate inventory creation failed but don't throw
      return null;
    }
  }
}

module.exports = InventoryServiceClient;
