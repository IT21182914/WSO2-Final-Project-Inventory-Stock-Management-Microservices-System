const express = require("express");
const router = express.Router();
const productSupplierController = require("../controllers/productSupplier.controller");
const {
  authenticateAsgardeo,
  authorizeRoles,
} = require("../middlewares/asgardeo.middleware");

// All routes require authentication
router.use(authenticateAsgardeo);

/**
 * @route   POST /api/product-suppliers
 * @desc    Add a product-supplier relationship
 * @access  Admin only
 */
router.post(
  "/",
  authorizeRoles("admin"),
  productSupplierController.addProductSupplier
);

/**
 * @route   GET /api/product-suppliers
 * @desc    Get all product-supplier relationships with filters
 * @access  Admin, Warehouse Staff
 */
router.get(
  "/",
  authorizeRoles("admin", "warehouse_staff"),
  productSupplierController.getAllProductSuppliers
);

/**
 * @route   GET /api/product-suppliers/supplier/:supplier_id
 * @desc    Get all products for a specific supplier
 * @access  Admin, Warehouse Staff, Supplier (own data)
 */
router.get(
  "/supplier/:supplier_id",
  authorizeRoles("admin", "warehouse_staff", "supplier"),
  productSupplierController.getProductsBySupplier
);

/**
 * @route   GET /api/product-suppliers/product/:product_id
 * @desc    Get all suppliers for a specific product
 * @access  Admin, Warehouse Staff
 */
router.get(
  "/product/:product_id",
  authorizeRoles("admin", "warehouse_staff"),
  productSupplierController.getSuppliersByProduct
);

/**
 * @route   PUT /api/product-suppliers/:id
 * @desc    Update a product-supplier relationship
 * @access  Admin only
 */
router.put(
  "/:id",
  authorizeRoles("admin"),
  productSupplierController.updateProductSupplier
);

/**
 * @route   DELETE /api/product-suppliers/:id
 * @desc    Delete a product-supplier relationship
 * @access  Admin only
 */
router.delete(
  "/:id",
  authorizeRoles("admin"),
  productSupplierController.deleteProductSupplier
);

module.exports = router;
