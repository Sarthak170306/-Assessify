const prisma = require('../config/prisma');

/**
 * Admin Statistics Controller
 * GET /api/admin/stats
 * Returns platform overview statistics across users, quizzes, categories, and attempts.
 */
const getAdminStats = async (req, res) => {
  try {
    // Query PostgreSQL using concurrent Promise.all / transaction for high performance
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
      // a) Total Users
      prisma.user.count(),
      // b) Users by Role
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      // c) Total Quizzes
      prisma.quiz.count(),
      // d) Quizzes by Status
      prisma.quiz.count({ where: { isPublished: true } }),
      prisma.quiz.count({ where: { isPublished: false } }),
      // e) Total Categories
      prisma.category.count(),
      // f) Total Quiz Attempts
      prisma.attempt.count(),
      // g) Average Score across completed attempts
      prisma.attempt.aggregate({
        _avg: { score: true },
        where: { status: 'COMPLETED' }
      })
    ]);

    // Calculate rounded average score safely with zero fallback
    const rawAvgScore = avgScoreResult._avg.score;
    const avgScore = rawAvgScore !== null && rawAvgScore !== undefined 
      ? Number(rawAvgScore.toFixed(2)) 
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

module.exports = {
  getAdminStats
};
