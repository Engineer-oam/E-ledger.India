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
    this.lastLoginAt = userData.lastLoginAt;
    this.failedLoginAttempts = userData.failedLoginAttempts || 0;
    this.lockedUntil = userData.lockedUntil;
    this.permissions = userData.permissions || []; // Additional permissions beyond role
  }

  static async create(userData) {
    const id = uuidv4();
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const sql = `
      INSERT INTO users (id, name, email, gln, role, org_name, country, sector, position_label, erp_type, erp_status, password_hash, salt, is_active, is_verified, last_login_at, failed_login_attempts, locked_until)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
      userData.isVerified,
      userData.lastLoginAt,
      userData.failedLoginAttempts || 0,
      userData.lockedUntil
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
      if (options.filters.gln) {
        paramCount++;
        filters.push(`gln = $${paramCount}`);
        values.push(options.filters.gln);
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

  // Enhanced authentication methods
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) {
      // Still hash the password to prevent timing attacks
      await bcrypt.hash(password, 10);
      return null;
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = user.lockedUntil;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (newFailedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await this.update(user.id, {
        failedLoginAttempts: newFailedAttempts,
        lockedUntil
      });
      
      return null;
    }

    // Reset failed attempts and update last login
    await this.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date()
    });

    return user;
  }

  async comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Method to check if user has specific permission
  hasPermission(permission) {
    // Check role-based permissions
    const rolePermissions = this.getRolePermissions(this.role);
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check additional permissions
    return this.permissions.includes(permission);
  }

  // Get all permissions for the user
  getAllPermissions() {
    const rolePermissions = this.getRolePermissions(this.role);
    return [...new Set([...rolePermissions, ...this.permissions])]; // Combine and deduplicate
  }

  // Get permissions based on role
  getRolePermissions(role) {
    const rolePermissionsMap = {
      'ADMIN': [
        'users:read', 'users:write', 'users:delete',
        'blocks:read', 'blocks:write',
        'transactions:read', 'transactions:write',
        'erp:read', 'erp:write',
        'compliance:read', 'compliance:write',
        'settings:read', 'settings:write'
      ],
      'MANAGER': [
        'users:read', 'users:write',
        'blocks:read',
        'transactions:read', 'transactions:write',
        'erp:read', 'erp:write',
        'compliance:read'
      ],
      'EMPLOYEE': [
        'transactions:read', 'transactions:write',
        'erp:read',
        'compliance:read'
      ],
      'SUPPLIER': [
        'transactions:read', 'transactions:write',
        'erp:read',
        'blocks:read'
      ],
      'DISTRIBUTOR': [
        'transactions:read', 'transactions:write',
        'erp:read',
        'blocks:read'
      ],
      'RETAILER': [
        'transactions:read', 'transactions:write',
        'erp:read',
        'blocks:read'
      ]
    };

    return rolePermissionsMap[role] || [];
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
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      failedLoginAttempts: this.failedLoginAttempts,
      lockedUntil: this.lockedUntil
    };
  }
}

// Helper function to convert camelCase to snake_case
function snakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = User;