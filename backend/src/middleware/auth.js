const { authDb } = require('../db/authDb');
const { asyncHandler } = require('./errorHandler');

// Middleware to verify authentication token
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.substring(7);
  
  try {
    const user = await authDb.getUserByToken(token);
    req.user = user;
    next();
  } catch (error) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }
});

// Optional authentication - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const user = await authDb.getUserByToken(token);
      req.user = user;
    } catch (error) {
      // Ignore auth errors for optional auth
      req.user = null;
    }
  }
  
  next();
});

module.exports = {
  authenticate,
  optionalAuth
};

