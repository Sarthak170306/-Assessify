const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Admin Routes (/api/admin)
 */

// GET /api/admin/stats - Platform Statistics Endpoint (Admin Only)
router.get('/stats', requireAuth, requireRole('ADMIN'), getAdminStats);

module.exports = router;
