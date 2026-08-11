const prisma = require('../config/prisma');

/**
 * Sync User Controller
 * POST /api/users/sync
 * Upserts user profile into PostgreSQL database via Prisma ORM.
 */
const syncUser = async (req, res) => {
  try {
    const clerkId = req.auth?.userId || req.body.clerkId || req.headers['x-clerk-user-id'];
    const { email, firstName, lastName, imageUrl } = req.body;
    let { name } = req.body;

    if (!clerkId && !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing clerkId or email required for user synchronization.'
      });
    }

    if (!name && (firstName || lastName)) {
      name = `${firstName || ''} ${lastName || ''}`.trim();
    }

    // Find existing user by clerkId OR email to prevent unique constraint conflicts
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(clerkId ? [{ clerkId }] : []),
          ...(email ? [{ email }] : [])
        ]
      }
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: clerkId || existingUser.clerkId,
          email: email || existingUser.email,
          name: name || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          imageUrl: imageUrl || undefined,
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          clerkId: clerkId || `user_${Date.now()}`,
          email: email,
          name: name || (email ? email.split('@')[0] : 'User'),
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          imageUrl: imageUrl || undefined,
          role: 'STUDENT',
          status: 'ACTIVE',
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User synchronized successfully with PostgreSQL database.',
      user
    });
  } catch (err) {
    console.error('syncUser error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to synchronize user record with database.',
      details: err.message
    });
  }
};

/**
 * Dev Mode Role Switcher Controller
 * PATCH /api/users/role
 * Unrestricted dev endpoint accepting { email, role } or { clerkId, role }
 */
const switchDevRole = async (req, res) => {
  try {
    const { email, clerkId, role } = req.body;

    // Payload validation
    if ((!email && !clerkId) || !role || !['ADMIN', 'STUDENT'].includes(role.toUpperCase())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Invalid payload. Email/ClerkID and valid role ('ADMIN' | 'STUDENT') required."
      });
    }

    const targetRole = role.toUpperCase();

    // Query PostgreSQL to check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(clerkId ? [{ clerkId }] : [])
        ]
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User record not found for ${email || clerkId}. Please sync user first.`
      });
    }

    // Direct database update using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: targetRole }
    });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${targetRole}`,
      user: updatedUser
    });
  } catch (err) {
    console.error('switchDevRole error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role in PostgreSQL database.',
      details: err.message
    });
  }
};

/**
 * Get All Users Controller (Admin Only)
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { clerkId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && ['ADMIN', 'TEACHER', 'STUDENT'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }

    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              attempts: true,
              quizzes: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      }
    });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users list.',
      details: err.message
    });
  }
};

/**
 * Get Single User Details & Attempt History (Admin Only)
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: id },
          { clerkId: id }
        ]
      },
      include: {
        attempts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                timeLimit: true,
              }
            }
          }
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            createdAt: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User with ID '${id}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('getUserById error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user details.',
      details: err.message
    });
  }
};

/**
 * Update User Account Status (Admin Only)
 * PATCH /api/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: id }, { clerkId: id }]
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: `User with ID '${id}' not found.`
      });
    }

    let newStatus = status ? status.toUpperCase() : (existingUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    if (!['ACTIVE', 'INACTIVE'].includes(newStatus)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Status must be either 'ACTIVE' or 'INACTIVE'."
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: { status: newStatus }
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to '${updatedUser.status}'.`,
      user: updatedUser
    });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user account status.',
      details: err.message
    });
  }
};

module.exports = {
  syncUser,
  getUsers,
  getUserById,
  updateUserStatus,
  switchDevRole,
  toggleUserRole: switchDevRole // Alias for backwards compatibility
};
