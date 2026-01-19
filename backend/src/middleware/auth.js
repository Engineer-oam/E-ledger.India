const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Role-based access control constants
const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  SUPPLIER: 'SUPPLIER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  RETAILER: 'RETAILER'
};

// Permission mapping
const PERMISSIONS = {
  // Admin permissions - full access
  [ROLES.ADMIN]: [
    'users:read', 'users:write', 'users:delete',
    'blocks:read', 'blocks:write',
    'transactions:read', 'transactions:write',
    'erp:read', 'erp:write',
    'compliance:read', 'compliance:write',
    'settings:read', 'settings:write'
  ],
  
  // Manager permissions - read/write for business operations
  [ROLES.MANAGER]: [
    'users:read', 'users:write',
    'blocks:read',
    'transactions:read', 'transactions:write',
    'erp:read', 'erp:write',
    'compliance:read'
  ],
  
  // Employee permissions - limited read/write access
  [ROLES.EMPLOYEE]: [
    'transactions:read', 'transactions:write',
    'erp:read',
    'compliance:read'
  ],
  
  // Supplier permissions - supply chain related access
  [ROLES.SUPPLIER]: [
    'transactions:read', 'transactions:write',
    'erp:read',
    'blocks:read'
  ],
  
  // Distributor permissions - distribution related access
  [ROLES.DISTRIBUTOR]: [
    'transactions:read', 'transactions:write',
    'erp:read',
    'blocks:read'
  ],
  
  // Retailer permissions - retail related access
  [ROLES.RETAILER]: [
    'transactions:read', 'transactions:write',
    'erp:read',
    'blocks:read'
  ]
};

// Middleware to check if user has required permissions
const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole] || [];

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Enhanced authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'gln', 'role', 'orgName', 'isActive', 'country', 'sector']
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Attach user and permissions to request object
    req.user = user;
    req.permissions = PERMISSIONS[user.role] || [];
    req.hasPermission = (permission) => req.permissions.includes(permission);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }

    next();
  };
};

// Resource ownership check middleware
const requireOwnership = (resourceField = 'gln') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For endpoints where the resource has a GLN field that should match the user's GLN
    if (req.params.gln && req.user.gln !== req.params.gln) {
      return res.status(403).json({ error: 'Resource ownership required' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  checkPermissions,
  requireRole,
  requireOwnership,
  ROLES,
  PERMISSIONS
};