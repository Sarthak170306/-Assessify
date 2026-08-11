const prisma = require('../config/prisma');

/**
 * Role-Based Authorization Middleware
 * Verifies that the request comes from an active user in PostgreSQL with one of the allowed roles.
 *
 * @param {...(string|string[])} allowedRoles - Single role or list of allowed roles (e.g. 'ADMIN' or ['ADMIN', 'TEACHER'])
 */
const requireRole = (...allowedRoles) => {
  // Normalize allowed roles array into uppercase strings
  const rolesList = allowedRoles.flat().map(r => String(r).toUpperCase());

  return async (req, res, next) => {
    try {
      // Extract user identity from token auth, header, body, or attached req.user
      const clerkId = req.auth?.userId || req.headers['x-clerk-user-id'] || req.body?.clerkId || req.user?.clerkId;
      const email = req.body?.email || req.user?.email;

      if (!clerkId && !email) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required. No user identity (clerkId or email) provided.'
        });
      }

      // Query PostgreSQL via Prisma for the fresh dbUser
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(clerkId ? [{ clerkId }] : []),
            ...(email ? [{ email }] : [])
          ]
        }
      });

      if (!dbUser) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'User record not found in PostgreSQL database. Please sync user first.'
        });
      }

      // Attach dbUser to request object for downstream controllers
      req.dbUser = dbUser;
      req.user = dbUser;

      // 1. Check account status
      if (dbUser.status === 'INACTIVE') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Account is inactive.'
        });
      }

      // 2. Check role permissions
      const userRole = (dbUser.role || '').toUpperCase();
      if (!rolesList.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${rolesList.join(' or ')}`
        });
      }

      next();
    } catch (err) {
      console.error('requireRole middleware error:', err);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to verify user authorization permissions.',
        details: err.message
      });
    }
  };
};

module.exports = {
  requireRole
};
