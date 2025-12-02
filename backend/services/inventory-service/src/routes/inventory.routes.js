const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const inventoryBusinessController = require("../controllers/inventoryBusiness.controller");
const {
  validateCreateInventory,
  validateAdjustStock,
  validateReserveStock,
  validateReleaseStock,
  validateUpdateInventory,
} = require("../middlewares/validation.middleware");

// Business Logic Routes (must come first - most specific)
router.post("/bulk-check", inventoryBusinessController.bulkStockCheck);
router.post("/reserve", inventoryBusinessController.reserveStock);
router.post("/release", inventoryBusinessController.releaseStock);
router.post("/confirm-deduction", inventoryBusinessController.confirmDeduction);
router.post("/return", inventoryBusinessController.returnStock);
router.post("/receive", inventoryBusinessController.receiveStock);
router.get("/alerts", inventoryBusinessController.getLowStockAlerts);
router.get(
  "/reorder-suggestions",
  inventoryBusinessController.getReorderSuggestions
);
router.get("/analytics", inventoryBusinessController.getAnalytics);
router.get("/history/:productId", inventoryBusinessController.getStockHistory);

// Create
router.post("/", validateCreateInventory, inventoryController.createInventory);

// Read - specific routes MUST come before parameterized routes
router.get("/", inventoryController.getAllInventory);
router.get("/movements", inventoryController.getStockMovements);
router.get("/product/:productId", inventoryController.getInventoryByProduct);
router.get("/:id", inventoryController.getInventoryById);

// Update
router.put(
  "/product/:productId",
  validateUpdateInventory,
  inventoryController.updateInventory
);

// Delete
router.delete("/product/:productId", inventoryController.deleteInventory);

// Stock operations (legacy - kept for backwards compatibility)
router.post("/adjust", validateAdjustStock, inventoryController.adjustStock);

module.exports = router;
