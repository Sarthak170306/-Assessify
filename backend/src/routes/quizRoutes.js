const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getStudentQuizzes
} = require('../controllers/quizController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Quiz Routes (/api/quizzes)
 */

// Student Catalog Fallback Endpoint
router.get('/student/catalog', getStudentQuizzes);

// Read Quizzes (Accessible to authenticated users)
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);

// Admin Mutation Routes (Require ADMIN Role)
router.post('/', requireAuth, requireRole('ADMIN'), createQuiz);
router.put('/:id', requireAuth, requireRole('ADMIN'), updateQuiz);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteQuiz);

module.exports = router;
