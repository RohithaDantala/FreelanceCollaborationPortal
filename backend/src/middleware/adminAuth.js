// backend/src/middleware/adminAuth.js
const { AppError } = require('./errorHandler');

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  if (req.user.role !== 'admin') {
    return next(
      new AppError('Access denied. Admin privileges required.', 403)
    );
  }

  next();
};

// Middleware to check if user is admin or project owner
exports.isAdminOrOwner = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const allowedRoles = ['admin', 'project_owner'];
  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError('Access denied. Insufficient privileges.', 403)
    );
  }

  next();
};

// Middleware to log admin actions
exports.logAdminAction = (action) => {
  return (req, res, next) => {
    // Log admin action
    console.log(`[ADMIN ACTION] ${action} by ${req.user.email} at ${new Date().toISOString()}`);
    
    // In production, you would save this to a database
    // AdminLog.create({
    //   user: req.user.id,
    //   action: action,
    //   details: { ...req.body, ...req.params },
    //   timestamp: Date.now()
    // });
    
    next();
  };
};