const prisma = require('../config/prisma');

/**
 * Analytics & Aggregate Statistics Controller
 */

// 1. Get Student Performance Analytics & Category Mastery Breakdown
// GET /api/analytics/student/:userId or GET /api/analytics/me
const getStudentAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    let targetUser = null;

    // Resolve target User
    if (userId && userId !== 'me') {
      targetUser = await prisma.user.findFirst({
        where: { OR: [{ id: userId }, { clerkId: userId }] }
      }).catch(() => null);
    }

    if (!targetUser) {
      const clerkId = req.auth?.userId || req.headers['x-clerk-user-id'];
      if (clerkId) {
        targetUser = await prisma.user.findFirst({
          where: { OR: [{ clerkId }, { id: clerkId }] }
        }).catch(() => null);
      }
    }

    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
      }).catch(() => null) || await prisma.user.findFirst().catch(() => null);
    }

    const resolvedUserId = targetUser ? targetUser.id : null;

    // Retrieve Student Attempts
    let attempts = [];
    if (resolvedUserId) {
      attempts = await prisma.attempt.findMany({
        where: {
          userId: resolvedUserId,
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' },
        include: {
          quiz: {
            include: {
              category: { select: { id: true, name: true } }
            }
          },
          answers: {
            select: { id: true, isCorrect: true }
          }
        }
      }).catch(() => []);
    }

    // Compute Core Overview Metrics
    const totalAttempts = attempts.length;
    let quizzesPassed = 0;
    let scoreSum = 0;
    let highestScore = 0;
    let totalTimeSpentSeconds = 0;
    let totalCorrectAnswers = 0;
    let totalAttemptedQuestions = 0;

    attempts.forEach((a) => {
      const passingScore = a.quiz?.passingScore || 70;
      const isPassed = a.score >= passingScore;
      if (isPassed) quizzesPassed++;

      scoreSum += a.score;
      if (a.score > highestScore) highestScore = a.score;

      // Duration calculation
      if (a.completedAt && a.createdAt) {
        const durationMs = new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime();
        if (durationMs > 0) totalTimeSpentSeconds += Math.round(durationMs / 1000);
      } else if (a.quiz?.timeLimit) {
        totalTimeSpentSeconds += a.quiz.timeLimit * 60;
      }

      if (Array.isArray(a.answers) && a.answers.length > 0) {
        a.answers.forEach((ans) => {
          totalAttemptedQuestions++;
          if (ans.isCorrect) totalCorrectAnswers++;
        });
      } else if (a.totalQuestions > 0) {
        totalAttemptedQuestions += a.totalQuestions;
        totalCorrectAnswers += Math.round((a.score / 100) * a.totalQuestions);
      }
    });

    const averageScore = totalAttempts > 0 ? Number((scoreSum / totalAttempts).toFixed(1)) : 0;
    const accuracyRate = totalAttemptedQuestions > 0 
      ? Number(((totalCorrectAnswers / totalAttemptedQuestions) * 100).toFixed(1))
      : (totalAttempts > 0 ? averageScore : 0);

    // Timeline Performance History
    const history = attempts.map((a) => {
      const passingScore = a.quiz?.passingScore || 70;
      return {
        attemptId: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz?.title || 'Assessment Quiz',
        categoryName: a.quiz?.category?.name || 'General Domain',
        scorePercentage: a.score,
        isPassed: a.score >= passingScore,
        date: a.completedAt || a.createdAt
      };
    });

    // Category Mastery Breakdown
    const categoryMap = {};
    attempts.forEach((a) => {
      const catName = a.quiz?.category?.name || 'General Domain';
      if (!categoryMap[catName]) {
        categoryMap[catName] = {
          categoryName: catName,
          attemptsCount: 0,
          scoreSum: 0,
          highestScore: 0
        };
      }
      categoryMap[catName].attemptsCount++;
      categoryMap[catName].scoreSum += a.score;
      if (a.score > categoryMap[catName].highestScore) {
        categoryMap[catName].highestScore = a.score;
      }
    });

    const categoryBreakdown = Object.values(categoryMap).map((cat) => {
      const avgScore = cat.attemptsCount > 0 ? Number((cat.scoreSum / cat.attemptsCount).toFixed(1)) : 0;
      let masteryLevel = 'Novice';
      if (avgScore >= 85) masteryLevel = 'Master';
      else if (avgScore >= 70) masteryLevel = 'Intermediate';

      return {
        categoryName: cat.categoryName,
        attemptsCount: cat.attemptsCount,
        averageScore: avgScore,
        highestScore: cat.highestScore,
        masteryLevel
      };
    });

    return res.status(200).json({
      success: true,
      user: targetUser ? { id: targetUser.id, name: targetUser.name, email: targetUser.email } : null,
      data: {
        overview: {
          totalAttempts,
          quizzesPassed,
          averageScore,
          highestScore,
          accuracyRate,
          totalTimeSpentSeconds
        },
        history,
        categoryBreakdown
      }
    });
  } catch (err) {
    console.error('getStudentAnalytics error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to compute student performance analytics.',
      details: err.message
    });
  }
};

// 2. Get Administrative Platform Analytics Overview
// GET /api/analytics/overview
const getAdminPlatformOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalQuizzes,
      publishedQuizzesCount,
      draftQuizzesCount,
      totalAttempts,
      platformAvgAgg,
      popularQuizzesRaw,
      recentAttemptsRaw
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.quiz.count().catch(() => 0),
      prisma.quiz.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
      prisma.quiz.count({ where: { status: 'DRAFT' } }).catch(() => 0),
      prisma.attempt.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.attempt.aggregate({
        _avg: { score: true },
        where: { status: 'COMPLETED' }
      }).catch(() => ({ _avg: { score: 0 } })),
      prisma.quiz.findMany({
        take: 5,
        orderBy: { attempts: { _count: 'desc' } },
        include: {
          category: { select: { name: true } },
          _count: { select: { attempts: true, questions: true } }
        }
      }).catch(() => []),
      prisma.attempt.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, imageUrl: true } },
          quiz: { select: { id: true, title: true, passingScore: true, category: { select: { name: true } } } }
        }
      }).catch(() => [])
    ]);

    const platformAverageScore = platformAvgAgg?._avg?.score 
      ? Number(platformAvgAgg._avg.score.toFixed(1)) 
      : 0;

    const mostPopularQuizzes = popularQuizzesRaw.map((q) => ({
      id: q.id,
      title: q.title,
      categoryName: q.category?.name || 'General Domain',
      status: q.status,
      attemptsCount: q._count?.attempts || 0,
      questionsCount: q._count?.questions || 0
    }));

    const recentAttemptsFeed = recentAttemptsRaw.map((a) => {
      const passingScore = a.quiz?.passingScore || 70;
      return {
        id: a.id,
        userName: a.user?.name || a.user?.email || 'Student User',
        userEmail: a.user?.email || '',
        quizTitle: a.quiz?.title || 'Assessment Quiz',
        categoryName: a.quiz?.category?.name || 'General Domain',
        scorePercentage: a.score,
        isPassed: a.score >= passingScore,
        date: a.completedAt || a.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalQuizzes,
        publishedQuizzes: publishedQuizzesCount,
        draftQuizzes: draftQuizzesCount,
        totalAttempts,
        platformAverageScore,
        mostPopularQuizzes,
        recentAttemptsFeed
      }
    });
  } catch (err) {
    console.error('getAdminPlatformOverview error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve administrative platform analytics.',
      details: err.message
    });
  }
};

module.exports = {
  getStudentAnalytics,
  getAdminPlatformOverview
};
