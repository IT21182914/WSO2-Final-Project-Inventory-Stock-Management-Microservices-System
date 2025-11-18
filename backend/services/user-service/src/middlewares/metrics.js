const client = require("prom-client");

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: "user_service_",
  timeout: 5000,
});

// Custom metrics for HTTP requests
const httpRequestDuration = new client.Histogram({
  name: "user_service_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: "user_service_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestsInProgress = new client.Gauge({
  name: "user_service_http_requests_in_progress",
  help: "Number of HTTP requests currently in progress",
  labelNames: ["method", "route"],
});

// Database metrics
const dbQueryDuration = new client.Histogram({
  name: "user_service_db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

const dbConnectionsActive = new client.Gauge({
  name: "user_service_db_connections_active",
  help: "Number of active database connections",
});

const dbConnectionsIdle = new client.Gauge({
  name: "user_service_db_connections_idle",
  help: "Number of idle database connections",
});

// Business metrics
const userRegistrations = new client.Counter({
  name: "user_service_registrations_total",
  help: "Total number of user registrations",
});

const userLogins = new client.Counter({
  name: "user_service_logins_total",
  help: "Total number of user logins",
  labelNames: ["status"],
});

const authenticationErrors = new client.Counter({
  name: "user_service_authentication_errors_total",
  help: "Total number of authentication errors",
  labelNames: ["reason"],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbConnectionsIdle);
register.registerMetric(userRegistrations);
register.registerMetric(userLogins);
register.registerMetric(authenticationErrors);

/**
 * Middleware to collect HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint to avoid recursion
  if (req.path === "/metrics") {
    return next();
  }

  const start = Date.now();
  const route = req.route ? req.route.path : req.path;

  // Increment in-progress gauge
  httpRequestsInProgress.inc({ method: req.method, route });

  // Capture response finish event
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    // Decrement in-progress gauge
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
  dbQueryDuration.observe(
    { operation, table },
    durationMs / 1000 // Convert to seconds
  );
};

/**
 * Increment user registration counter
 */
const incrementRegistrations = () => {
  userRegistrations.inc();
};

/**
 * Increment user login counter
 */
const incrementLogins = (status) => {
  userLogins.inc({ status });
};

/**
 * Increment authentication error counter
 */
const incrementAuthErrors = (reason) => {
  authenticationErrors.inc({ reason });
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
  incrementRegistrations,
  incrementLogins,
  incrementAuthErrors,
  getMetrics,
  getContentType,
};
