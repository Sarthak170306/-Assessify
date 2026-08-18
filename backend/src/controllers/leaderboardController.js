const prisma = require('../config/prisma');

/**
 * Dynamic Global & Quiz-Specific Leaderboards Controller
 */

// 1. Get Platform Global All-Time & Weekly Leaderboard
// GET /api/leaderboard/global?timeframe=all-time|weekly&limit=20
const getGlobalLeaderboard = async (req, res) => {
  try {
    const timeframe = (req.query.timeframe || 'all-time').toLowerCase();
    const limit = parseInt(req.query.limit, 10) || 20;

    // 1. Build Date Filter
    const where = {
      status: 'COMPLETED'
    };

    if (timeframe === 'weekly') {
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
            passingScore: true
          }
        }
      }
    }).catch(() => []);

    // 3. Group and Aggregate per User
    const userMap = {};
    rawAttempts.forEach((a) => {
      const uid = a.userId;
      if (!uid) return;

      if (!userMap[uid]) {
        userMap[uid] = {
          userId: uid,
          clerkId: a.user?.clerkId || '',
          name: a.user?.name || a.user?.email || 'Student User',
          email: a.user?.email || '',
          imageUrl: a.user?.imageUrl || null,
          totalAttempts: 0,
          quizzesPassed: 0,
          totalScorePoints: 0,
          highestScore: 0,
          totalTimeSpentSeconds: 0
        };
      }

      userMap[uid].totalAttempts++;
      userMap[uid].totalScorePoints += Math.round(a.score);
      if (a.score > userMap[uid].highestScore) {
        userMap[uid].highestScore = Math.round(a.score);
      }

      const passingScore = a.quiz?.passingScore || 70;
      if (a.score >= passingScore) {
        userMap[uid].quizzesPassed++;
      }

      if (a.completedAt && a.createdAt) {
        const durationMs = new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime();
        if (durationMs > 0) userMap[uid].totalTimeSpentSeconds += Math.round(durationMs / 1000);
      }
    });

    // 4. Composite Sort
    // Primary: Total Score Points (Desc)
    // Secondary: Quizzes Passed (Desc)
    // Tertiary: Total Time Spent (Asc - faster wins)
    const sortedLeaderboard = Object.values(userMap).sort((a, b) => {
      if (b.totalScorePoints !== a.totalScorePoints) {
        return b.totalScorePoints - a.totalScorePoints;
      }
      if (b.quizzesPassed !== a.quizzesPassed) {
        return b.quizzesPassed - a.quizzesPassed;
      }
      return a.totalTimeSpentSeconds - b.totalTimeSpentSeconds;
    });

    // 5. Assign Ranks
    const fullRankedLeaderboard = sortedLeaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
      averageScore: item.totalAttempts > 0 ? Number((item.totalScorePoints / item.totalAttempts).toFixed(1)) : 0
    }));

    // 6. Slice Top N for response
    const topLeaderboard = fullRankedLeaderboard.slice(0, limit);

    // 7. Resolve Authenticated User's Current Rank
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
          totalScorePoints: foundUserRank.totalScorePoints,
          quizzesPassed: foundUserRank.quizzesPassed,
          totalAttempts: foundUserRank.totalAttempts,
          averageScore: foundUserRank.averageScore
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        timeframe,
        totalRankedUsers: fullRankedLeaderboard.length,
        leaderboard: topLeaderboard,
        userRank
      }
    });
  } catch (err) {
    console.error('getGlobalLeaderboard error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve global leaderboard rankings.',
      details: err.message
    });
  }
};

// 2. Get Quiz-Specific Leaderboard
// GET /api/leaderboard/quiz/:quizId?limit=15
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

    // 1. Verify Quiz Existence
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

    // 2. Fetch Completed Attempts for this Quiz
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

    // 3. Best-Attempt Per User Deduplication
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
        isPassed: a.score >= quiz.passingScore,
        timeTakenSeconds,
        completedAt: a.completedAt || a.createdAt
      };

      if (!bestUserAttempts[uid]) {
        bestUserAttempts[uid] = candidate;
      } else {
        const currentBest = bestUserAttempts[uid];
        // Compare: Higher Score > Lower TimeTaken > Earlier CompletedAt
        if (candidate.scorePercentage > currentBest.scorePercentage) {
          bestUserAttempts[uid] = candidate;
        } else if (candidate.scorePercentage === currentBest.scorePercentage) {
          if (candidate.timeTakenSeconds < currentBest.timeTakenSeconds) {
            bestUserAttempts[uid] = candidate;
          } else if (candidate.timeTakenSeconds === currentBest.timeTakenSeconds) {
            if (new Date(candidate.completedAt) < new Date(currentBest.completedAt)) {
              bestUserAttempts[uid] = candidate;
            }
          }
        }
      }
    });

    // 4. Sort Deduplicated Leaderboard
    const sortedAttempts = Object.values(bestUserAttempts).sort((a, b) => {
      if (b.scorePercentage !== a.scorePercentage) {
        return b.scorePercentage - a.scorePercentage;
      }
      if (a.timeTakenSeconds !== b.timeTakenSeconds) {
        return a.timeTakenSeconds - b.timeTakenSeconds;
      }
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    });

    // 5. Assign Ranks
    const rankedLeaderboard = sortedAttempts.slice(0, limit).map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    return res.status(200).json({
      success: true,
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
  getGlobalLeaderboard,
  getQuizLeaderboard
};
