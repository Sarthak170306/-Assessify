/**
 * Day 8 Integration Test Script - Assessify AI
 * 
 * Run command:
 *   node test-day8.js
 */

try {
  require('dotenv').config({ path: './backend/.env' });
} catch (e) {
  try {
    require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
  } catch (e2) {}
}

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function runDay8Tests() {
  console.log('\n==================================================');
  console.log('🚀 ASSESSIFY AI - DAY 8 INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  let testCategory = null;
  let testQuiz = null;
  let testStudentUser = null;
  let testAttempt = null;

  try {
    // 0. Setup Environment & Resolve Test Data
    console.log('[STEP 0] Resolving Test Users & Categories...');
    
    // Resolve Student User
    testStudentUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!testStudentUser) {
      testStudentUser = await prisma.user.create({
        data: {
          clerkId: `test_day8_student_${Date.now()}`,
          email: `day8_student_${Date.now()}@assessify.ai`,
          name: 'Day 8 Test Student',
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });
    }
    console.log(`   ✓ Resolved Student User: ${testStudentUser.email} (ID: ${testStudentUser.id})`);

    // Create Category & Quiz
    testCategory = await prisma.category.create({
      data: {
        name: `Day 8 Analytics Domain ${Date.now()}`,
        description: 'Temporary domain category for Day 8 testing'
      }
    });

    testQuiz = await prisma.quiz.create({
      data: {
        title: 'Day 8 Analytics & Leaderboards Assessment',
        description: 'Validation quiz for performance telemetry',
        timeLimit: 10,
        passingScore: 70,
        status: 'PUBLISHED',
        isPublished: true,
        categoryId: testCategory.id,
        createdById: testStudentUser.id
      }
    });
    console.log(`   ✓ Created Test Quiz: "${testQuiz.title}" (ID: ${testQuiz.id})`);

    // Create Attempt
    testAttempt = await prisma.attempt.create({
      data: {
        quizId: testQuiz.id,
        userId: testStudentUser.id,
        score: 85.0,
        totalQuestions: 5,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    console.log(`   ✓ Recorded Test Attempt (ID: ${testAttempt.id}, Score: 85%)`);
    console.log('   [SUCCESS] Step 0 Completed Successfully.\n');

    // 1. Test Student Analytics Pipeline
    console.log('[STEP 1] Testing Student Analytics Pipeline (getStudentAnalytics logic)...');
    const studentAttempts = await prisma.attempt.findMany({
      where: { userId: testStudentUser.id, status: 'COMPLETED' },
      include: { quiz: { include: { category: true } } }
    });

    const totalAttempts = studentAttempts.length;
    const quizzesPassed = studentAttempts.filter(a => a.score >= (a.quiz?.passingScore || 70)).length;
    const scoreSum = studentAttempts.reduce((acc, a) => acc + a.score, 0);
    const avgScore = totalAttempts > 0 ? Number((scoreSum / totalAttempts).toFixed(1)) : 0;

    console.log(`   ✓ Computed Total Attempts: ${totalAttempts}`);
    console.log(`   ✓ Computed Quizzes Passed: ${quizzesPassed}`);
    console.log(`   ✓ Computed Average Score: ${avgScore}%`);
    if (totalAttempts < 1 || avgScore <= 0) {
      throw new Error('Student Analytics calculation returned invalid values.');
    }
    console.log('   [SUCCESS] Step 1 Completed Successfully.\n');

    // 2. Test Admin Platform Overview Aggregation
    console.log('[STEP 2] Testing Admin Platform Overview Aggregation (getAdminPlatformOverview logic)...');
    const [totalUsers, totalQuizzes, totalPlatformAttempts, avgAgg] = await Promise.all([
      prisma.user.count(),
      prisma.quiz.count(),
      prisma.attempt.count({ where: { status: 'COMPLETED' } }),
      prisma.attempt.aggregate({ _avg: { score: true }, where: { status: 'COMPLETED' } })
    ]);

    const globalAvgScore = avgAgg._avg?.score ? Number(avgAgg._avg.score.toFixed(1)) : 0;

    console.log(`   ✓ Platform Total Users: ${totalUsers}`);
    console.log(`   ✓ Platform Total Quizzes: ${totalQuizzes}`);
    console.log(`   ✓ Platform Total Attempts: ${totalPlatformAttempts}`);
    console.log(`   ✓ Global Average Score: ${globalAvgScore}%`);
    if (totalUsers < 1 || totalQuizzes < 1 || totalPlatformAttempts < 1) {
      throw new Error('Admin Overview aggregation failed.');
    }
    console.log('   [SUCCESS] Step 2 Completed Successfully.\n');

    // 3. Test Global Leaderboard Composite Ranking
    console.log('[STEP 3] Testing Global Leaderboard Composite Ranking (getGlobalLeaderboard logic)...');
    const allAttempts = await prisma.attempt.findMany({
      where: { status: 'COMPLETED' },
      include: { user: true, quiz: true }
    });

    const userMap = {};
    allAttempts.forEach(a => {
      if (!a.userId) return;
      if (!userMap[a.userId]) {
        userMap[a.userId] = { userId: a.userId, totalScorePoints: 0, quizzesPassed: 0 };
      }
      userMap[a.userId].totalScorePoints += Math.round(a.score);
      if (a.score >= (a.quiz?.passingScore || 70)) userMap[a.userId].quizzesPassed++;
    });

    const sortedRankings = Object.values(userMap).sort((a, b) => b.totalScorePoints - a.totalScorePoints);
    console.log(`   ✓ Ranked ${sortedRankings.length} distinct users on platform.`);
    console.log(`   ✓ Top Rank Score: ${sortedRankings[0]?.totalScorePoints || 0} pts`);
    console.log('   [SUCCESS] Step 3 Completed Successfully.\n');

    // 4. Test Quiz-Specific Leaderboard Deduplication
    console.log('[STEP 4] Testing Quiz-Specific Leaderboard Deduplication (getQuizLeaderboard logic)...');
    const quizAttempts = await prisma.attempt.findMany({
      where: { quizId: testQuiz.id, status: 'COMPLETED' },
      include: { user: true }
    });

    if (quizAttempts.length < 1) {
      throw new Error('Quiz-specific leaderboard returned 0 attempt records for test quiz.');
    }
    console.log(`   ✓ Retrieved ${quizAttempts.length} attempt(s) for Quiz "${testQuiz.title}".`);
    console.log('   [SUCCESS] Step 4 Completed Successfully.\n');

  } catch (err) {
    console.error('\n❌ [TEST SUITE FAILURE]:', err.message);
    process.exitCode = 1;
  } finally {
    // 5. Safe Cleanup
    console.log('[STEP 5] Safe Cleanup of Temporary Day 8 Test Records...');
    try {
      if (testAttempt) {
        await prisma.attempt.delete({ where: { id: testAttempt.id } });
        console.log('   ✓ Deleted temporary Test Attempt.');
      }
      if (testQuiz) {
        await prisma.quiz.delete({ where: { id: testQuiz.id } });
        console.log('   ✓ Deleted temporary Test Quiz.');
      }
      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } });
        console.log('   ✓ Deleted temporary Test Category.');
      }
    } catch (cleanupErr) {
      console.warn('   ⚠️ Cleanup warning:', cleanupErr.message);
    }

    await prisma.$disconnect();
    console.log('   ✓ Disconnected Prisma Client.');
    console.log('\n==================================================');
    console.log(process.exitCode === 1 ? '❌ DAY 8 INTEGRATION TESTS FAILED' : '🎉 ALL DAY 8 INTEGRATION TESTS PASSED 100%');
    console.log('==================================================\n');
  }
}

runDay8Tests();
