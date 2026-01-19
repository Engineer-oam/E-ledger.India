const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.gln = userData.gln;
    this.role = userData.role;
    this.orgName = userData.orgName;
    this.country = userData.country;
    this.sector = userData.sector;
    this.positionLabel = userData.positionLabel;
    this.erpType = userData.erpType;
    this.erpStatus = userData.erpStatus || 'PENDING';
    this.passwordHash = userData.passwordHash;
    this.salt = userData.salt;
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    this.isVerified = userData.isVerified !== undefined ? userData.isVerified : false;
    this.createdAt = userData.createdAt;
    this.updatedAt = userData.updatedAt;
  }

  static async create(userData) {
    const id = uuidv4();
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const sql = `
      INSERT INTO users (id, name, email, gln, role, org_name, country, sector, position_label, erp_type, erp_status, password_hash, salt, is_active, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      id,
      userData.name,
      userData.email,
      userData.gln,
      userData.role,
      userData.orgName,
      userData.country,
      userData.sector,
      userData.positionLabel,
      userData.erpType,
      userData.erpStatus,
      passwordHash,
      salt,
      userData.isActive,
      userData.isVerified
    ];

    const result = await query(sql, values);
    return new User(result.rows[0]);
  }

  static async findByPk(id) {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findByGLN(gln) {
    const sql = 'SELECT * FROM users WHERE gln = $1';
    const result = await query(sql, [gln]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM users';
    const values = [];
    let paramCount = 0;

    if (options.filters) {
      const filters = [];
      if (options.filters.role) {
        paramCount++;
        filters.push(`role = $${paramCount}`);
        values.push(options.filters.role);
      }
      if (options.filters.sector) {
        paramCount++;
        filters.push(`sector = $${paramCount}`);
        values.push(options.filters.sector);
      }
      if (options.filters.country) {
        paramCount++;
        filters.push(`country = $${paramCount}`);
        values.push(options.filters.country);
      }
      if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
      }
    }

    if (options.order) {
      sql += ` ORDER BY ${options.order}`;
    }

    if (options.limit) {
      sql += ` LIMIT $${paramCount + 1}`;
      values.push(options.limit);
    }

    const result = await query(sql, values);
    return result.rows.map(row => new User(row));
  }

  static async update(id, updateData) {
    const updates = [];
    const values = [id];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'createdAt') {
        paramCount++;
        updates.push(`${snakeCase(key)} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] ? true : false;
  }

  async comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      gln: this.gln,
      role: this.role,
      orgName: this.orgName,
      country: this.country,
      sector: this.sector,
      positionLabel: this.positionLabel,
      erpType: this.erpType,
      erpStatus: this.erpStatus,
      isActive: this.isActive,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Helper function to convert camelCase to snake_case
function snakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = User;