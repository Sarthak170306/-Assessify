const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getStudentQuizzes,
  generateAIQuiz,
  saveAIQuiz
} = require('../controllers/quizController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Quiz Routes (/api/quizzes)
 */

// AI Quiz Generation & Bulk Save Pipelines
router.post('/generate-ai', generateAIQuiz);
router.post('/save-ai-quiz', saveAIQuiz);

// Student Catalog Fallback Endpoint
router.get('/student/catalog', getStudentQuizzes);

// Read Quizzes (Accessible to authenticated users)
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);

// Admin Mutation Routes (Require ADMIN Role)
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

module.exports = router;
