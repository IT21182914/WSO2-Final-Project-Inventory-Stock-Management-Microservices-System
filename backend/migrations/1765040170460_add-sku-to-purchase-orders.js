/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Add sku column to purchase_orders table
  pgm.addColumn("purchase_orders", {
    sku: {
      type: "varchar(50)",
      notNull: false,
    },
  });

  // Create index for faster lookups
  pgm.createIndex("purchase_orders", "sku", {
    name: "idx_purchase_orders_sku",
    ifNotExists: true,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Rollback: Remove index and column
  pgm.dropIndex("purchase_orders", "sku", {
    name: "idx_purchase_orders_sku",
    ifExists: true,
  });

  pgm.dropColumn("purchase_orders", "sku", {
    ifExists: true,
  });
};
