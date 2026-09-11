import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Role-based access control middleware for HealthDesk
 * Takes allowed roles (e.g. checkRole('admin') or checkRole('doctor', 'admin'))
 * and rejects with 403 if req.user's role (looked up from MongoDB via firebaseUID) doesn't match.
 *
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required: User not identified',
        });
      }

      // Check if user is the designated hospital superintendent / admin email
      const isOwnerAdmin = req.user.email?.toLowerCase() === 'abc@gmail.com' || (process.env.ADMIN_EMAIL && req.user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());
      if (isOwnerAdmin && allowedRoles.includes('admin')) {
        req.user.role = 'admin';
        return next();
      }

      let userRole = req.user.role || (req.mongoUser && req.mongoUser.role);

      // If userRole is missing or default, verify with MongoDB via firebaseUID or email
      if ((!userRole || userRole === 'patient') && req.user.uid && mongoose.connection.readyState === 1) {
        try {
          const userDoc = await User.findOne({
            $or: [{ firebaseUID: req.user.uid }, { email: req.user.email }],
          });
          if (userDoc) {
            req.mongoUser = userDoc;
            userRole = userDoc.role;
            req.user.role = userDoc.role;
          }
        } catch (dbErr) {
          console.warn('[checkRole] MongoDB lookup note:', dbErr.message);
        }
      }

      const effectiveRole = isOwnerAdmin && allowedRoles.includes('admin') ? 'admin' : userRole;

      if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This action requires ${allowedRoles.join(' or ')} privileges. Your current role is '${effectiveRole || 'unassigned'}'.`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default checkRole;
