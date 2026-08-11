const express = require('express');
const router = express.Router();
const { 
  syncUser, 
  getUsers, 
  getUserById, 
  updateUserStatus, 
  switchDevRole 
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

// 1. Sync User Profile from Clerk to PostgreSQL DB
router.post('/sync', requireAuth, syncUser);

// 2. Dev Mode Role Switcher Route (Public REST API route for dev testing - NO auth or role middleware)
router.patch('/role', switchDevRole);

// 3. Admin User Management: List all users with search, role filter, pagination (Admin only)
router.get('/', requireAuth, requireRole('ADMIN'), getUsers);

// 4. Admin User Management: Get single user details & attempt history (Admin only)
router.get('/:id', requireAuth, requireRole('ADMIN'), getUserById);

// 5. Admin User Management: Update user account status (ACTIVE / INACTIVE) (Admin only)
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), updateUserStatus);

module.exports = router;
