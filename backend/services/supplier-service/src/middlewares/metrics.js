const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "supplier_service_",
  timeout: 5000,
});

const httpRequestDuration = new client.Histogram({
  name: "supplier_service_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: "supplier_service_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestsInProgress = new client.Gauge({
  name: "supplier_service_http_requests_in_progress",
  help: "Number of HTTP requests currently in progress",
  labelNames: ["method", "route"],
});

const dbQueryDuration = new client.Histogram({
  name: "supplier_service_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

const dbConnectionsActive = new client.Gauge({
  name: "supplier_service_db_connections_active",
  help: "Number of active database connections",
});

const dbConnectionsIdle = new client.Gauge({
  name: "supplier_service_db_connections_idle",
  help: "Number of idle database connections",
});

const purchaseOrdersTotal = new client.Counter({
  name: "supplier_service_purchase_orders_total",
  help: "Total number of purchase orders",
  labelNames: ["status"],
});

const supplierRatings = new client.Gauge({
  name: "supplier_service_supplier_ratings",
  help: "Supplier performance ratings",
  labelNames: ["supplier_id"],
});

const purchaseOrderValue = new client.Histogram({
  name: "supplier_service_purchase_order_value_dollars",
  help: "Purchase order value in dollars",
  buckets: [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbConnectionsIdle);
register.registerMetric(purchaseOrdersTotal);
register.registerMetric(supplierRatings);
register.registerMetric(purchaseOrderValue);

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

const trackDbQuery = (operation, table, durationMs) => {
  dbQueryDuration.observe({ operation, table }, durationMs / 1000);
};

const incrementPurchaseOrders = (status) => {
  purchaseOrdersTotal.inc({ status });
};

const updateSupplierRating = (supplierId, rating) => {
  supplierRatings.set({ supplier_id: supplierId }, rating);
};

const recordPurchaseOrderValue = (value) => {
  purchaseOrderValue.observe(value);
};

const getMetrics = async () => {
  return await register.metrics();
};

const getContentType = () => {
  return register.contentType;
};

module.exports = {
  metricsMiddleware,
  updateDbMetrics,
  trackDbQuery,
  incrementPurchaseOrders,
  updateSupplierRating,
  recordPurchaseOrderValue,
  getMetrics,
  getContentType,
};
