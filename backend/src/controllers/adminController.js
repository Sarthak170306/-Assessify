const prisma = require('../config/prisma');

/**
 * Admin Controller (Express + Prisma)
 */

// 1. Get Basic Admin Stats (GET /api/admin/stats)
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      studentsCount,
      adminsCount,
      totalQuizzes,
      publishedQuizzesCount,
      draftQuizzesCount,
      totalCategories,
      totalAttempts,
      avgScoreResult
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { role: 'STUDENT' } }).catch(() => 0),
      prisma.user.count({ where: { role: 'ADMIN' } }).catch(() => 0),
      prisma.quiz.count().catch(() => 0),
      prisma.quiz.count({ where: { isPublished: true } }).catch(() => 0),
      prisma.quiz.count({ where: { isPublished: false } }).catch(() => 0),
      prisma.category.count().catch(() => 0),
      prisma.attempt.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.attempt.aggregate({
        _avg: { score: true },
        where: { status: 'COMPLETED' }
      }).catch(() => ({ _avg: { score: 0 } }))
    ]);

    const rawAvgScore = avgScoreResult?._avg?.score;
    const avgScore = rawAvgScore !== null && rawAvgScore !== undefined 
      ? Number(rawAvgScore.toFixed(1)) 
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: studentsCount,
          admins: adminsCount
        },
        quizzes: {
          total: totalQuizzes,
          published: publishedQuizzesCount,
          draft: draftQuizzesCount
        },
        categories: {
          total: totalCategories
        },
        attempts: {
          total: totalAttempts,
          avgScore: avgScore
        }
      }
    });
  } catch (err) {
    console.error('getAdminStats controller error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve admin statistics from database.',
      details: err.message
    });
  }
};

// 2. Get Comprehensive Admin Analytics & Pass/Fail Ratios (GET /api/admin/analytics)
const getAdminAnalytics = async (req, res) => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      totalQuizzes,
      publishedQuizzesCount,
      draftQuizzesCount,
      totalQuestions,
      allCompletedAttempts,
      avgScoreAgg,
      popularQuizzesRaw,
      recentTimelineAttempts
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }).catch(() => 0),
      prisma.quiz.count().catch(() => 0),
      prisma.quiz.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
      prisma.quiz.count({ where: { status: 'DRAFT' } }).catch(() => 0),
      prisma.question.count().catch(() => 0),
      prisma.attempt.findMany({
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          score: true,
          quiz: { select: { passingScore: true } }
        }
      }).catch(() => []),
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
        where: {
          status: 'COMPLETED',
          createdAt: { gte: fourteenDaysAgo }
        },
        orderBy: { createdAt: 'asc' },
        select: {
          score: true,
          createdAt: true
        }
      }).catch(() => [])
    ]);

    // Calculate Pass / Fail Metrics
    const totalAttempts = allCompletedAttempts.length;
    let passedAttempts = 0;
    let failedAttempts = 0;

    allCompletedAttempts.forEach((a) => {
      const passingScore = a.quiz?.passingScore || 70;
      if (a.score >= passingScore) passedAttempts++;
      else failedAttempts++;
    });

    const passRate = totalAttempts > 0 ? Number(((passedAttempts / totalAttempts) * 100).toFixed(1)) : 0;
    const averageScore = avgScoreAgg?._avg?.score ? Number(avgScoreAgg._avg.score.toFixed(1)) : 0;

    // Popular Quizzes Format
    const mostPopularQuizzes = popularQuizzesRaw.map((q) => ({
      id: q.id,
      title: q.title,
      categoryName: q.category?.name || 'General Domain',
      attemptsCount: q._count?.attempts || 0,
      questionsCount: q._count?.questions || 0
    }));

    // Group Timeline Attempts by Date
    const timelineMap = {};
    recentTimelineAttempts.forEach((a) => {
      const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = {
          date: dateStr,
          dateFormatted: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          count: 0,
          scoreSum: 0
        };
      }
      timelineMap[dateStr].count++;
      timelineMap[dateStr].scoreSum += a.score;
    });

    const attemptsOverTime = Object.values(timelineMap).map((item) => ({
      date: item.date,
      dateFormatted: item.dateFormatted,
      count: item.count,
      avgScore: item.count > 0 ? Number((item.scoreSum / item.count).toFixed(1)) : 0
    }));

    const dataPayload = {
      totalStudents,
      totalQuizzes,
      publishedQuizzes: publishedQuizzesCount,
      draftQuizzes: draftQuizzesCount,
      totalQuestions,
      totalAttempts,
      passedAttempts,
      failedAttempts,
      passRate,
      averageScore,
      platformAverageScore: averageScore,
      mostPopularQuizzes,
      attemptsOverTime
    };

    return res.status(200).json({
      success: true,
      data: dataPayload
    });
  } catch (err) {
    console.error('getAdminAnalytics controller error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to compute administrative analytics.',
      details: err.message
    });
  }
};

// 3. Get Recent Platform Attempts Audit Feed (GET /api/admin/attempts)
const getAdminAttemptsFeed = async (req, res) => {
  try {
    const rawAttempts = await prisma.attempt.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, imageUrl: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimit: true,
            category: { select: { id: true, name: true } }
          }
        }
      }
    }).catch(() => []);

    const attempts = rawAttempts.map((a) => {
      const passingScore = a.quiz?.passingScore || 70;
      const isPassed = a.score >= passingScore;

      let timeTaken = 0;
      if (a.completedAt && a.createdAt) {
        const durationMs = new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime();
        if (durationMs > 0) timeTaken = Math.round(durationMs / 1000);
      } else if (a.quiz?.timeLimit) {
        timeTaken = a.quiz.timeLimit * 60;
      }

      return {
        id: a.id,
        userName: a.user?.name || a.user?.email || 'Student User',
        userEmail: a.user?.email || '',
        userAvatar: a.user?.imageUrl || null,
        quizTitle: a.quiz?.title || 'Assessment Quiz',
        categoryName: a.quiz?.category?.name || 'General Domain',
        scorePercentage: a.score,
        score: a.score,
        passingScore,
        isPassed,
        passed: isPassed,
        timeTaken,
        completedAt: a.completedAt || a.createdAt,
        createdAt: a.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      count: attempts.length,
      attempts
    });
  } catch (err) {
    console.error('getAdminAttemptsFeed controller error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve administrative attempt audit stream.',
      details: err.message
    });
  }
};

module.exports = {
  getAdminStats,
  getAdminAnalytics,
  getAdminAttemptsFeed
};
