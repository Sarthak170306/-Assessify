const express = require('express');
const router = express.Router();
const { 
  getStudentQuizzes, 
  getStudentQuizById,
  getStudentQuizQuestions 
} = require('../controllers/quizController');
const { 
  submitAttempt, 
  getAttemptHistory 
} = require('../controllers/attemptController');
const { getAttemptAIFeedback } = require('../controllers/aiFeedbackController');

/**
 * Student Portal Routes (/api/student)
 */

// Published Quiz Catalog (GET /api/student/quizzes)
router.get('/quizzes', getStudentQuizzes);

// Published Quiz Pre-start Details (GET /api/student/quizzes/:id)
router.get('/quizzes/:id', getStudentQuizById);

// Published Quiz Questions for Live Test Engine (GET /api/student/quizzes/:id/questions)
router.get('/quizzes/:id/questions', getStudentQuizQuestions);

// Submit Quiz Attempt (POST /api/student/quizzes/:id/submit)
router.post('/quizzes/:id/submit', submitAttempt);

// Student Attempt History (GET /api/student/history)
router.get('/history', getAttemptHistory);

// AI Feedback Endpoint (POST /api/student/attempts/:attemptId/feedback)
router.post('/attempts/:attemptId/feedback', getAttemptAIFeedback);
router.get('/attempts/:attemptId/feedback', getAttemptAIFeedback);

module.exports = router;
