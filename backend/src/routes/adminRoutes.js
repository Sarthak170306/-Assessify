const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  getAdminAnalytics, 
  getAdminAttemptsFeed 
} = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Admin Routes (/api/admin)
 */

// GET /api/admin/stats - Platform Statistics Endpoint
router.get('/stats', getAdminStats);

// GET /api/admin/analytics - Comprehensive Admin Analytics & Pass/Fail Ratios
router.get('/analytics', getAdminAnalytics);

// GET /api/admin/attempts - Platform Attempt Audit Stream
router.get('/attempts', getAdminAttemptsFeed);

module.exports = router;
