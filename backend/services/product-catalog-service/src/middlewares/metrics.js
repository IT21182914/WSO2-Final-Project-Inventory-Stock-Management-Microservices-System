const client = require("prom-client");

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: "product_catalog_service_",
  timeout: 5000,
});

// Custom metrics for HTTP requests
const httpRequestDuration = new client.Histogram({
  name: "product_catalog_service_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: "product_catalog_service_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestsInProgress = new client.Gauge({
  name: "product_catalog_service_http_requests_in_progress",
  help: "Number of HTTP requests currently in progress",
  labelNames: ["method", "route"],
});

// Database metrics
const dbQueryDuration = new client.Histogram({
  name: "product_catalog_service_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

const dbConnectionsActive = new client.Gauge({
  name: "product_catalog_service_db_connections_active",
  help: "Number of active database connections",
});

const dbConnectionsIdle = new client.Gauge({
  name: "product_catalog_service_db_connections_idle",
  help: "Number of idle database connections",
});

// Business metrics
const productsTotal = new client.Gauge({
  name: "product_catalog_service_products_total",
  help: "Total number of products in catalog",
});

const categoriesTotal = new client.Gauge({
  name: "product_catalog_service_categories_total",
  help: "Total number of categories",
});

const productOperations = new client.Counter({
  name: "product_catalog_service_product_operations_total",
  help: "Total number of product operations",
  labelNames: ["operation"],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbConnectionsIdle);
register.registerMetric(productsTotal);
register.registerMetric(categoriesTotal);
register.registerMetric(productOperations);

/**
 * Middleware to collect HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const start = Date.now();
  const route = req.route ? req.route.path : req.path;

  httpRequestsInProgress.inc({ method: req.method, route });

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestsInProgress.dec({ method: req.method, route });
  });

  next();
};

/**
 * Update database connection pool metrics
 */
const updateDbMetrics = (pool) => {
  if (
    pool &&
    typeof pool.totalCount === "number" &&
    typeof pool.idleCount === "number"
  ) {
    dbConnectionsActive.set(pool.totalCount - pool.idleCount);
    dbConnectionsIdle.set(pool.idleCount);
  }
};

/**
 * Track database query duration
 */
const trackDbQuery = (operation, table, durationMs) => {
  dbQueryDuration.observe({ operation, table }, durationMs / 1000);
};

/**
 * Increment product operation counter
 */
const incrementProductOperations = (operation) => {
  productOperations.inc({ operation });
};

/**
 * Update product and category counts
 */
const updateProductCounts = (productCount, categoryCount) => {
  if (productCount !== undefined) productsTotal.set(productCount);
  if (categoryCount !== undefined) categoriesTotal.set(categoryCount);
};

/**
 * Get metrics in Prometheus format
 */
const getMetrics = async () => {
  return await register.metrics();
};

/**
 * Get content type for metrics
 */
const getContentType = () => {
  return register.contentType;
};

module.exports = {
  metricsMiddleware,
  updateDbMetrics,
  trackDbQuery,
  incrementProductOperations,
  updateProductCounts,
  getMetrics,
  getContentType,
};
