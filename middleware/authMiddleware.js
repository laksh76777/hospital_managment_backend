// Simple Authentication and Authorization Middleware
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    // In production, verify JWT token here
    req.user = { id: 'sample-user-id', role: 'patient' };
    return next();
  }

  // Allow through for dev routes if needed, or enforce token
  req.user = { id: 'guest-id', role: 'guest' };
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'unauthorized'} is not permitted to access this resource`,
      });
    }
    next();
  };
};
