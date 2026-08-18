const express = require('express');
const router = express.Router();
const { 
  getGlobalLeaderboard, 
  getQuizLeaderboard 
} = require('../controllers/leaderboardController');

/**
 * Dynamic Leaderboards Routes (/api/leaderboard)
 */

// Platform Global All-Time & Weekly Leaderboard (GET /api/leaderboard/global)
router.get('/global', getGlobalLeaderboard);

// Quiz-Specific Leaderboard (GET /api/leaderboard/quiz/:quizId)
router.get('/quiz/:quizId', getQuizLeaderboard);

module.exports = router;
