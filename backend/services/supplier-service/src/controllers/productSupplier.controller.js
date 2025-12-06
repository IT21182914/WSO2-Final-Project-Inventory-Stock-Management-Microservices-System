const ProductSupplier = require("../models/productSupplier.model");
const axios = require("axios");

// Product Catalog Service URL
const PRODUCT_CATALOG_URL =
  process.env.PRODUCT_CATALOG_URL || "http://product-catalog-service:3002";

/**
 * Add a product-supplier relationship
 */
exports.addProductSupplier = async (req, res) => {
  try {
    const {
      product_id,
      supplier_id,
      supplier_unit_price,
      lead_time_days,
      minimum_order_quantity,
      is_preferred,
      notes,
    } = req.body;

    // Validate required fields
    if (!product_id || !supplier_id || !supplier_unit_price) {
      return res.status(400).json({
        success: false,
        message:
          "Product ID, Supplier ID, and Supplier Unit Price are required",
      });
    }

    // Check if relationship already exists
    const exists = await ProductSupplier.exists(product_id, supplier_id);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "This product-supplier relationship already exists",
      });
    }

    // Verify product exists (call Product Catalog Service)
    try {
      await axios.get(`${PRODUCT_CATALOG_URL}/api/products/${product_id}`);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Product not found in catalog",
      });
    }

    // Create the relationship
    const productSupplier = await ProductSupplier.create({
      product_id,
      supplier_id,
      supplier_unit_price,
      lead_time_days,
      minimum_order_quantity,
      is_preferred,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Product-supplier relationship created successfully",
      data: productSupplier,
    });
  } catch (error) {
    console.error("Error creating product-supplier relationship:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product-supplier relationship",
      error: error.message,
    });
  }
};

/**
 * Get all products for a supplier
 */
exports.getProductsBySupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;

    const productSuppliers = await ProductSupplier.findBySupplier(supplier_id);

    // Fetch product details from Product Catalog Service
    const productIds = productSuppliers.map((ps) => ps.product_id);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No products found for this supplier",
      });
    }

    // Fetch product details in batch
    try {
      const productsResponse = await axios.post(
        `${PRODUCT_CATALOG_URL}/api/products/batch`,
        {
          ids: productIds,
        }
      );

      // Merge product details with supplier-specific data
      const enrichedData = productSuppliers.map((ps) => {
        const product = productsResponse.data.data.find(
          (p) => p.id === ps.product_id
        );
        return {
          ...ps,
          product_name: product?.name || "Unknown Product",
          product_sku: product?.sku || "N/A",
          product_description: product?.description,
          product_category_id: product?.category_id,
          product_unit_price: product?.unit_price,
          product_is_active: product?.is_active,
        };
      });

      res.status(200).json({
        success: true,
        data: enrichedData,
      });
    } catch (error) {
      console.error("Error fetching product details:", error.message);
      // Return supplier data even if product service fails
      res.status(200).json({
        success: true,
        data: productSuppliers,
        warning: "Could not fetch complete product details",
      });
    }
  } catch (error) {
    console.error("Error fetching products by supplier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products for supplier",
      error: error.message,
    });
  }
};

/**
 * Get all suppliers for a product
 */
exports.getSuppliersByProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const productSuppliers = await ProductSupplier.findByProduct(product_id);

    res.status(200).json({
      success: true,
      data: productSuppliers,
    });
  } catch (error) {
    console.error("Error fetching suppliers by product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers for product",
      error: error.message,
    });
  }
};

/**
 * Update a product-supplier relationship
 */
exports.updateProductSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await ProductSupplier.update(id, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product-supplier relationship not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product-supplier relationship updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating product-supplier relationship:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product-supplier relationship",
      error: error.message,
    });
  }
};

/**
 * Delete a product-supplier relationship
 */
exports.deleteProductSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ProductSupplier.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product-supplier relationship not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product-supplier relationship deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product-supplier relationship:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product-supplier relationship",
      error: error.message,
    });
  }
};

/**
 * Get all product-supplier relationships
 */
exports.getAllProductSuppliers = async (req, res) => {
  try {
    console.log(
      "[getAllProductSuppliers] Request received with query:",
      req.query
    );

    const { limit, offset, is_active, supplier_id, product_id } = req.query;

    const filters = {
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    };

    if (is_active !== undefined) {
      filters.is_active = is_active === "true";
    }

    if (supplier_id) {
      filters.supplier_id = parseInt(supplier_id);
    }

    if (product_id) {
      filters.product_id = parseInt(product_id);
    }

    console.log("[getAllProductSuppliers] Fetching with filters:", filters);
    const productSuppliers = await ProductSupplier.findAll(filters);
    console.log(
      "[getAllProductSuppliers] Found",
      productSuppliers.length,
      "product-supplier relationships"
    );

    // Fetch product details from Product Catalog Service
    const productIds = [
      ...new Set(productSuppliers.map((ps) => ps.product_id)),
    ];
    console.log("[getAllProductSuppliers] Unique product IDs:", productIds);

    if (productIds.length > 0) {
      try {
        const batchUrl = `${PRODUCT_CATALOG_URL}/api/products/batch`;
        const batchPayload = { ids: productIds };
        console.log(
          "[getAllProductSuppliers] Calling Product Catalog batch API:",
          batchUrl
        );
        console.log(
          "[getAllProductSuppliers] Batch payload:",
          JSON.stringify(batchPayload)
        );

        const productsResponse = await axios.post(batchUrl, batchPayload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization || "",
          },
        });

        console.log(
          "[getAllProductSuppliers] Product Catalog response status:",
          productsResponse.status
        );
        console.log(
          "[getAllProductSuppliers] Products fetched:",
          productsResponse.data.data?.length || 0
        );

        // Merge product details with supplier-specific data
        const enrichedData = productSuppliers.map((ps) => {
          const product = productsResponse.data.data.find(
            (p) => p.id === ps.product_id
          );
          return {
            ...ps,
            product_name: product?.name || `Product ID: ${ps.product_id}`,
            product_sku: product?.sku || "N/A",
            product_description: product?.description,
            product_category_id: product?.category_id,
            product_unit_price: product?.unit_price,
            product_is_active: product?.is_active,
          };
        });

        console.log(
          "[getAllProductSuppliers] Enriched data sample:",
          enrichedData[0]
        );
        return res.status(200).json({
          success: true,
          data: enrichedData,
          count: enrichedData.length,
        });
      } catch (error) {
        console.error(
          "[getAllProductSuppliers] Error fetching product details:",
          error.message
        );
        console.error(
          "[getAllProductSuppliers] Error response:",
          error.response?.status,
          error.response?.data
        );
        // Return data without product details if service call fails
      }
    }

    res.status(200).json({
      success: true,
      data: productSuppliers,
      count: productSuppliers.length,
    });
  } catch (error) {
    console.error("Error fetching product-supplier relationships:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product-supplier relationships",
      error: error.message,
    });
  }
};
