const express = require('express');
const router = express.Router();
const { 
  submitAttempt, 
  getAttemptHistory, 
  getUserAttemptHistory,
  getAttemptById, 
  getAttemptResultById
} = require('../controllers/attemptController');
const { getAttemptAIFeedback } = require('../controllers/aiFeedbackController');

/**
 * Quiz Attempt & Submission Routes (/api/attempts)
 */

// Submit Attempt & Automated Score Calculation (POST /api/attempts/submit)
router.post('/submit', submitAttempt);

// Get User Attempt History (GET /api/attempts & GET /api/attempts/history)
router.get('/', getUserAttemptHistory);
router.get('/history', getUserAttemptHistory);

// Get AI Diagnostic Feedback for an Attempt (POST & GET /api/attempts/:attemptId/feedback)
router.post('/:attemptId/feedback', getAttemptAIFeedback);
router.get('/:attemptId/feedback', getAttemptAIFeedback);

// Get Attempt Result Breakdown & Answer Review by ID (GET /api/attempts/:id)
router.get('/:id', getAttemptResultById);

module.exports = router;
