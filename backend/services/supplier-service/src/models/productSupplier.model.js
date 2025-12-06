const pool = require("../config/database");

class ProductSupplier {
  /**
   * Add a product-supplier relationship
   */
  static async create(data) {
    const {
      product_id,
      supplier_id,
      supplier_unit_price,
      lead_time_days = 7,
      minimum_order_quantity = 1,
      is_preferred = false,
      notes = null,
    } = data;

    const result = await pool.query(
      `INSERT INTO product_suppliers 
       (product_id, supplier_id, supplier_unit_price, lead_time_days, 
        minimum_order_quantity, is_preferred, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        product_id,
        supplier_id,
        supplier_unit_price,
        lead_time_days,
        minimum_order_quantity,
        is_preferred,
        notes,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get all products for a specific supplier
   */
  static async findBySupplier(supplier_id) {
    const result = await pool.query(
      `SELECT ps.*, 
              s.name as supplier_name,
              s.contact_person,
              s.email as supplier_email
       FROM product_suppliers ps
       JOIN suppliers s ON ps.supplier_id = s.id
       WHERE ps.supplier_id = $1 AND ps.is_active = true
       ORDER BY ps.is_preferred DESC, ps.product_id ASC`,
      [supplier_id]
    );

    return result.rows;
  }

  /**
   * Get all suppliers for a specific product
   */
  static async findByProduct(product_id) {
    const result = await pool.query(
      `SELECT ps.*, 
              s.name as supplier_name,
              s.contact_person,
              s.email as supplier_email,
              s.rating as supplier_rating,
              s.is_active as supplier_active
       FROM product_suppliers ps
       JOIN suppliers s ON ps.supplier_id = s.id
       WHERE ps.product_id = $1 AND ps.is_active = true
       ORDER BY ps.is_preferred DESC, ps.supplier_unit_price ASC`,
      [product_id]
    );

    return result.rows;
  }

  /**
   * Get a specific product-supplier relationship
   */
  static async findOne(product_id, supplier_id) {
    const result = await pool.query(
      `SELECT ps.*, 
              s.name as supplier_name,
              s.contact_person,
              s.email as supplier_email
       FROM product_suppliers ps
       JOIN suppliers s ON ps.supplier_id = s.id
       WHERE ps.product_id = $1 AND ps.supplier_id = $2`,
      [product_id, supplier_id]
    );

    return result.rows[0];
  }

  /**
   * Update a product-supplier relationship
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.supplier_unit_price !== undefined) {
      fields.push(`supplier_unit_price = $${paramCount++}`);
      values.push(data.supplier_unit_price);
    }
    if (data.lead_time_days !== undefined) {
      fields.push(`lead_time_days = $${paramCount++}`);
      values.push(data.lead_time_days);
    }
    if (data.minimum_order_quantity !== undefined) {
      fields.push(`minimum_order_quantity = $${paramCount++}`);
      values.push(data.minimum_order_quantity);
    }
    if (data.is_preferred !== undefined) {
      fields.push(`is_preferred = $${paramCount++}`);
      values.push(data.is_preferred);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE product_suppliers 
       SET ${fields.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete a product-supplier relationship
   */
  static async delete(id) {
    const result = await pool.query(
      "DELETE FROM product_suppliers WHERE id = $1 RETURNING *",
      [id]
    );

    return result.rows[0];
  }

  /**
   * Get all product-supplier relationships with pagination
   */
  static async findAll(filters = {}) {
    const {
      limit = 100,
      offset = 0,
      is_active,
      supplier_id,
      product_id,
    } = filters;

    let query = `
      SELECT ps.*, 
             s.name as supplier_name,
             s.contact_person,
             s.email as supplier_email
      FROM product_suppliers ps
      JOIN suppliers s ON ps.supplier_id = s.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      query += ` AND ps.is_active = $${paramCount++}`;
      values.push(is_active);
    }

    if (supplier_id) {
      query += ` AND ps.supplier_id = $${paramCount++}`;
      values.push(supplier_id);
    }

    if (product_id) {
      query += ` AND ps.product_id = $${paramCount++}`;
      values.push(product_id);
    }

    query += ` ORDER BY ps.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Check if a product-supplier relationship exists
   */
  static async exists(product_id, supplier_id) {
    const result = await pool.query(
      "SELECT id FROM product_suppliers WHERE product_id = $1 AND supplier_id = $2",
      [product_id, supplier_id]
    );

    return result.rows.length > 0;
  }
}

module.exports = ProductSupplier;
