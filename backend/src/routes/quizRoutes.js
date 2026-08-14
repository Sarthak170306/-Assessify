const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz
} = require('../controllers/quizController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Quiz Routes (/api/quizzes)
 */

// Read Quizzes (Accessible to authenticated users)
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);

// Admin Mutation Routes (Require ADMIN Role)
router.post('/', requireAuth, requireRole('ADMIN'), createQuiz);
router.put('/:id', requireAuth, requireRole('ADMIN'), updateQuiz);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteQuiz);

module.exports = router;
