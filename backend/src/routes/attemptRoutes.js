const express = require('express');
const router = express.Router();
const { 
  submitAttempt, 
  getAttemptHistory, 
  getAttemptById 
} = require('../controllers/attemptController');
const { getAttemptAIFeedback } = require('../controllers/aiFeedbackController');

/**
 * Quiz Attempt & Submission Routes (/api/attempts)
 */

// Submit Attempt & Automated Score Calculation (POST /api/attempts/submit)
router.post('/submit', submitAttempt);

// Get User Attempt History (GET /api/attempts/history)
router.get('/history', getAttemptHistory);

// Get AI Diagnostic Feedback for an Attempt (POST & GET /api/attempts/:attemptId/feedback)
router.post('/:attemptId/feedback', getAttemptAIFeedback);
router.get('/:attemptId/feedback', getAttemptAIFeedback);

// Get Attempt Result Breakdown by ID (GET /api/attempts/:attemptId)
router.get('/:attemptId', getAttemptById);

module.exports = router;
