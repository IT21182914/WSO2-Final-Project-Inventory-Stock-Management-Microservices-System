const db = require("../config/database");
const logger = require("../config/logger");

class Category {
  static async create(data) {
    const { name, description } = data;

    // Auto-generate code from category name (first 3 letters, uppercase)
    const code = name.substring(0, 3).toUpperCase();

    const query = `
      INSERT INTO categories (name, description, code)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [name, description, code]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error creating category:", error);
      throw error;
    }
  }

  static async findAll() {
    const query = "SELECT * FROM categories ORDER BY name";

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error("Error finding all categories:", error);
      throw error;
    }
  }

  static async findById(id) {
    const query = "SELECT * FROM categories WHERE id = $1";

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error finding category by ID:", error);
      throw error;
    }
  }

  static async update(id, data) {
    const { name, description } = data;

    // Auto-generate code from category name if name is being updated
    const code = name ? name.substring(0, 3).toUpperCase() : null;

    const query = `
      UPDATE categories 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          code = COALESCE($3, code),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    try {
      const result = await db.query(query, [name, description, code, id]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error updating category:", error);
      throw error;
    }
  }

  static async delete(id) {
    const query = "DELETE FROM categories WHERE id = $1 RETURNING *";

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error("Error deleting category:", error);
      throw error;
    }
  }
}

module.exports = Category;
