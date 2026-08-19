const express = require('express');
const router = express.Router();
const { 
  getLeaderboard, 
  getGlobalLeaderboard, 
  getQuizLeaderboard 
} = require('../controllers/leaderboardController');

/**
 * Leaderboard Routes (/api/leaderboard)
 */

// GET /api/leaderboard - Overall & Category-wise Leaderboard
router.get('/', getLeaderboard);

// GET /api/leaderboard/global - Alias for Global Leaderboard
router.get('/global', getGlobalLeaderboard);

// GET /api/leaderboard/quiz/:quizId - Quiz-Specific Leaderboard
router.get('/quiz/:quizId', getQuizLeaderboard);

module.exports = router;
