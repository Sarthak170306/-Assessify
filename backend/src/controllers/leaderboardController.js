const prisma = require('../config/prisma');

/**
 * Dynamic Global & Category-wise Leaderboards Controller (Express + Prisma)
 */

// 1. Get Leaderboard (GET /api/leaderboard)
// Supports optional categoryId, timeframe, and limit query parameters
const getLeaderboard = async (req, res) => {
  try {
    const { categoryId, timeframe = 'all-time' } = req.query;
    const limit = parseInt(req.query.limit, 10) || 25;

    // 1. Build Prisma Where Clause
    const where = {
      status: 'COMPLETED'
    };

    if (categoryId && categoryId !== 'all') {
      where.quiz = {
        OR: [
          { categoryId: categoryId },
          { category: { name: { equals: categoryId, mode: 'insensitive' } } }
        ]
      };
    }

    if (timeframe.toLowerCase() === 'weekly') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: sevenDaysAgo };
    }

    // 2. Query Completed Attempts from Prisma
    const rawAttempts = await prisma.attempt.findMany({
      where,
      select: {
        id: true,
        userId: true,
        score: true,
        completedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            email: true,
            imageUrl: true
          }
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            category: { select: { id: true, name: true } }
          }
        }
      }
    }).catch(() => []);

    // 3. Group and Aggregate per Student User
    const userMap = {};
    rawAttempts.forEach((a) => {
      const uid = a.userId;
      if (!uid) return;

      if (!userMap[uid]) {
        userMap[uid] = {
          userId: uid,
          id: uid,
          clerkId: a.user?.clerkId || '',
          name: a.user?.name || a.user?.email || 'Student User',
          email: a.user?.email || '',
          imageUrl: a.user?.imageUrl || null,
          totalQuizzesCompleted: 0,
          quizzesPassed: 0,
          totalScorePoints: 0,
          totalPoints: 0,
          highestScore: 0,
          totalTimeSpentSeconds: 0
        };
      }

      userMap[uid].totalQuizzesCompleted += 1;
      const scoreVal = Math.round(a.score);
      userMap[uid].totalScorePoints += scoreVal;
      userMap[uid].totalPoints += scoreVal;

      if (scoreVal > userMap[uid].highestScore) {
        userMap[uid].highestScore = scoreVal;
      }

      const passingScore = a.quiz?.passingScore || 70;
      if (a.score >= passingScore) {
        userMap[uid].quizzesPassed += 1;
      }

      if (a.completedAt && a.createdAt) {
        const durationMs = new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime();
        if (durationMs > 0) userMap[uid].totalTimeSpentSeconds += Math.round(durationMs / 1000);
      }
    });

    // 4. Rank Sorting Formula:
    // Primary: highestScore (Desc)
    // Secondary: averageScore (Desc)
    // Tertiary: totalQuizzesCompleted (Desc)
    const processedUsers = Object.values(userMap).map((user) => {
      const averageScore = user.totalQuizzesCompleted > 0 
        ? Number((user.totalScorePoints / user.totalQuizzesCompleted).toFixed(1)) 
        : 0;
      return {
        ...user,
        averageScore
      };
    });

    processedUsers.sort((a, b) => {
      if (b.highestScore !== a.highestScore) {
        return b.highestScore - a.highestScore;
      }
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      if (b.totalQuizzesCompleted !== a.totalQuizzesCompleted) {
        return b.totalQuizzesCompleted - a.totalQuizzesCompleted;
      }
      return a.totalTimeSpentSeconds - b.totalTimeSpentSeconds;
    });

    // 5. Assign Rank numbers and Medal Badges
    const fullRankedLeaderboard = processedUsers.map((item, index) => {
      const rank = index + 1;
      let badge = null;
      if (rank === 1) badge = 'GOLD';
      else if (rank === 2) badge = 'SILVER';
      else if (rank === 3) badge = 'BRONZE';

      return {
        rank,
        badge,
        medal: badge,
        ...item
      };
    });

    // Slice for limit
    const topLeaderboard = fullRankedLeaderboard.slice(0, limit);

    // 6. Resolve Authenticated User's Specific Rank
    const reqClerkId = req.auth?.userId || req.headers['x-clerk-user-id'];
    const reqDbUserId = req.dbUser?.id || req.user?.id;
    let userRank = null;

    if (reqDbUserId || reqClerkId) {
      const foundUserRank = fullRankedLeaderboard.find(
        (u) => u.userId === reqDbUserId || u.clerkId === reqClerkId
      );
      if (foundUserRank) {
        userRank = {
          rank: foundUserRank.rank,
          averageScore: foundUserRank.averageScore,
          highestScore: foundUserRank.highestScore,
          totalQuizzesCompleted: foundUserRank.totalQuizzesCompleted,
          totalPoints: foundUserRank.totalPoints,
          quizzesPassed: foundUserRank.quizzesPassed
        };
      }
    }

    const dataPayload = {
      categoryId: categoryId || 'all',
      timeframe,
      totalParticipants: fullRankedLeaderboard.length,
      leaderboard: topLeaderboard,
      userRank
    };

    return res.status(200).json({
      success: true,
      leaderboard: topLeaderboard,
      userRank,
      data: dataPayload
    });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve leaderboard rankings.',
      details: err.message
    });
  }
};

// Aliases for route backward compatibility
const getGlobalLeaderboard = getLeaderboard;

// 2. Get Quiz-Specific Leaderboard (GET /api/leaderboard/quiz/:quizId)
const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 15;

    if (!quizId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'quizId parameter is required.'
      });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        passingScore: true,
        category: { select: { id: true, name: true } }
      }
    }).catch(() => null);

    if (!quiz) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Quiz with ID '${quizId}' not found.`
      });
    }

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId,
        status: 'COMPLETED'
      },
      select: {
        id: true,
        userId: true,
        score: true,
        completedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true
          }
        }
      }
    }).catch(() => []);

    const bestUserAttempts = {};
    attempts.forEach((a) => {
      const uid = a.userId;
      if (!uid) return;

      let timeTakenSeconds = 0;
      if (a.completedAt && a.createdAt) {
        const durationMs = new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime();
        if (durationMs > 0) timeTakenSeconds = Math.round(durationMs / 1000);
      }

      const candidate = {
        attemptId: a.id,
        userId: uid,
        name: a.user?.name || a.user?.email || 'Student User',
        email: a.user?.email || '',
        imageUrl: a.user?.imageUrl || null,
        scorePercentage: a.score,
        highestScore: a.score,
        isPassed: a.score >= quiz.passingScore,
        timeTakenSeconds,
        completedAt: a.completedAt || a.createdAt
      };

      if (!bestUserAttempts[uid] || candidate.scorePercentage > bestUserAttempts[uid].scorePercentage) {
        bestUserAttempts[uid] = candidate;
      }
    });

    const sortedAttempts = Object.values(bestUserAttempts).sort((a, b) => {
      if (b.scorePercentage !== a.scorePercentage) {
        return b.scorePercentage - a.scorePercentage;
      }
      return a.timeTakenSeconds - b.timeTakenSeconds;
    });

    const rankedLeaderboard = sortedAttempts.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    return res.status(200).json({
      success: true,
      leaderboard: rankedLeaderboard,
      data: {
        quizId: quiz.id,
        quizTitle: quiz.title,
        categoryName: quiz.category?.name || 'General Domain',
        passingScore: quiz.passingScore,
        totalParticipants: sortedAttempts.length,
        leaderboard: rankedLeaderboard
      }
    });
  } catch (err) {
    console.error('getQuizLeaderboard error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve quiz leaderboard.',
      details: err.message
    });
  }
};

module.exports = {
  getLeaderboard,
  getGlobalLeaderboard,
  getQuizLeaderboard
};
