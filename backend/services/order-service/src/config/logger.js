const winston = require("winston");

// Helper to safely stringify objects with circular references
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    },
    2
  );
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "order-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, service, ...meta }) => {
            try {
              return `${timestamp} [${service}] ${level}: ${message} ${
                Object.keys(meta).length ? safeStringify(meta) : ""
              }`;
            } catch (error) {
              return `${timestamp} [${service}] ${level}: ${message} [Error stringifying metadata]`;
            }
          }
        )
      ),
    }),
  ],
});

module.exports = logger;
