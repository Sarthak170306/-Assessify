const express = require('express');
const router = express.Router();
const { 
  submitAttempt, 
  getAttemptHistory, 
  getAttemptById 
} = require('../controllers/attemptController');

/**
 * Quiz Attempt & Submission Routes (/api/attempts)
 */

// Submit Attempt & Automated Score Calculation (POST /api/attempts/submit)
router.post('/submit', submitAttempt);

// Get User Attempt History (GET /api/attempts/history)
router.get('/history', getAttemptHistory);

// Get Attempt Result Breakdown by ID (GET /api/attempts/:attemptId)
router.get('/:attemptId', getAttemptById);

module.exports = router;
