const express = require('express');
const router = express.Router();
const { 
  getStudentAnalytics, 
  getAdminPlatformOverview 
} = require('../controllers/analyticsController');

/**
 * Analytics & Performance Metrics Routes (/api/analytics)
 */

// Student Performance Analytics & Category Mastery (GET /api/analytics/student/:userId & /api/analytics/me)
router.get('/me', getStudentAnalytics);
router.get('/student/:userId', getStudentAnalytics);

// Admin Platform Analytics Overview (GET /api/analytics/overview)
router.get('/overview', getAdminPlatformOverview);

module.exports = router;
