/**
 * Grant access to specific roles
 * @param  {...string} roles - Allowed roles ('admin', 'staff', 'customer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' does not have permission to access this resource. Allowed roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Check if the user is an admin OR owns the specific resource
 */
const authorizeOwnerOrStaffOrAdmin = (getOwnerIdFn) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admins and Staff have broader oversight
    if (['admin', 'staff'].includes(req.user.role)) {
      return next();
    }

    // Customer can only access their own data
    const ownerId = typeof getOwnerIdFn === 'function' ? getOwnerIdFn(req) : req.params.id;
    if (req.user._id.toString() !== ownerId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Customers can only access their own records.'
      });
    }

    next();
  };
};

module.exports = {
  authorize,
  authorizeOwnerOrStaffOrAdmin
};

