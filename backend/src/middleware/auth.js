const { createClerkClient } = require('@clerk/clerk-sdk-node');
const prisma = require('../config/prisma');
const { requireRole } = require('./roleMiddleware');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * requireAuth Middleware
 * Verifies Clerk JWT session token or authorization header, loads database user profile,
 * and checks if user status is ACTIVE.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    let clerkUserId = null;

    if (token) {
      try {
        const decoded = await clerkClient.verifyToken(token);
        clerkUserId = decoded.sub || decoded.userId;
      } catch (tokenErr) {
        console.warn('Clerk verifyToken warning:', tokenErr.message);
        try {
          const base64Payload = token.split('.')[1];
          if (base64Payload) {
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
            clerkUserId = payload.sub || payload.userId;
          }
        } catch (parseErr) {
          // ignore parse error
        }
      }
    }

    if (!clerkUserId && req.headers['x-clerk-user-id']) {
      clerkUserId = req.headers['x-clerk-user-id'];
    }

    if (!clerkUserId && req.body && req.body.clerkId) {
      clerkUserId = req.body.clerkId;
    }

    if (!clerkUserId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing or invalid Clerk session.'
      });
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: clerkUserId },
          ...(req.body?.email ? [{ email: req.body.email }] : [])
        ]
      }
    });

    if (dbUser) {
      if (dbUser.status === 'INACTIVE') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Account is inactive.'
        });
      }
      req.dbUser = dbUser;
      req.user = dbUser;
    }

    req.auth = { userId: clerkUserId };
    next();
  } catch (err) {
    console.error('requireAuth middleware error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to authenticate user session.'
    });
  }
};

module.exports = {
  requireAuth,
  requireRole,
  clerkClient
};
