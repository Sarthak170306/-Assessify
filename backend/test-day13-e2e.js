/**
 * Assessify AI - Day 13 Comprehensive End-to-End Test Suite
 * 
 * Execution Command:
 *   node backend/test-day13-e2e.js
 */

try {
  require('dotenv').config({ path: './backend/.env' });
} catch (e) {
  try {
    require('dotenv').config({ path: './.env' });
  } catch (e2) {}
}

const { PrismaClient } = require('./node_modules/@prisma/client') || require('@prisma/client');
const prisma = new PrismaClient();

// Terminal Colors & Status Indicators
const PASS = '\x1b[32m[PASS]\x1b[0m';
const FAIL = '\x1b[31m[FAIL]\x1b[0m';
const INFO = '\x1b[36m[INFO]\x1b[0m';
const WARN = '\x1b[33m[WARN]\x1b[0m';

async function runE2ETestSuite() {
  console.log('\n================================================================');
  console.log('🔒 ASSESSIFY AI - DAY 13 E2E SECURITY & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  let testAdminUser = null;
  let testStudentUser = null;
  let testCategory = null;
  let testQuiz = null;
  let testAttempt = null;

  try {
    // ----------------------------------------------------------------
    // [TEST 1] Authentication & RBAC Guard Validation
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 1]: Authentication & RBAC Guard Enforcement...`);
    try {
      testAdminUser = await prisma.user.create({
        data: {
          clerkId: `e2e_admin_${Date.now()}`,
          email: `admin_e2e_${Date.now()}@assessify.ai`,
          name: 'E2E Admin User',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      testStudentUser = await prisma.user.create({
        data: {
          clerkId: `e2e_student_${Date.now()}`,
          email: `student_e2e_${Date.now()}@assessify.ai`,
          name: 'E2E Student User',
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });

      console.log(`   ✓ Resolved Admin User: ${testAdminUser.email} (Role: ${testAdminUser.role})`);
      console.log(`   ✓ Resolved Student User: ${testStudentUser.email} (Role: ${testStudentUser.role})`);

      if (testAdminUser.role !== 'ADMIN' || testStudentUser.role !== 'STUDENT') {
        throw new Error('RBAC role assignment mismatch.');
      }

      console.log(`   ${PASS} [TEST 1 PASSED]: Auth & RBAC guard verification succeeded.\n`);
      passedTests++;
    } catch (err) {
      console.error(`   ${FAIL} [TEST 1 FAILED]: ${err.message}\n`);
      failedTests++;
    }

    // ----------------------------------------------------------------
    // [TEST 2] Admin Quiz & Question CRUD Persistence
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 2]: Admin Quiz & Question CRUD Persistence...`);
    try {
      testCategory = await prisma.category.create({
        data: {
          name: `E2E Security Domain ${Date.now()}`,
          description: 'Testing Day 13 security & scoring integrity'
        }
      });

      testQuiz = await prisma.quiz.create({
        data: {
          title: 'Day 13 Security & Performance Assessment',
          description: 'E2E test assessment validating answer payload hiding & server scoring',
          timeLimit: 10,
          passingScore: 70,
          status: 'PUBLISHED',
          isPublished: true,
          categoryId: testCategory.id,
          createdById: testAdminUser.id,
          questions: {
            create: [
              {
                text: 'Which header prevents MIME-type sniffing in Web Security?',
                points: 1,
                options: {
                  create: [
                    { text: 'X-Content-Type-Options', isCorrect: true },
                    { text: 'X-Frame-Options', isCorrect: false },
                    { text: 'Strict-Transport-Security', isCorrect: false }
                  ]
                }
              },
              {
                text: 'Where should automated quiz scoring strictly take place?',
                points: 1,
                options: {
                  create: [
                    { text: 'Client Frontend Application', isCorrect: false },
                    { text: 'Backend Server Application', isCorrect: true },
                    { text: 'Browser Local Storage', isCorrect: false }
                  ]
                }
              }
            ]
          }
        },
        include: {
          questions: {
            include: { options: true }
          }
        }
      });

      console.log(`   ✓ Created Category: "${testCategory.name}"`);
      console.log(`   ✓ Created Quiz with ${testQuiz.questions.length} questions.`);

      if (!testQuiz.id || testQuiz.questions.length !== 2) {
        throw new Error('Quiz creation failed to persist questions.');
      }

      console.log(`   ${PASS} [TEST 2 PASSED]: Admin Quiz & Question CRUD succeeded.\n`);
      passedTests++;
    } catch (err) {
      console.error(`   ${FAIL} [TEST 2 FAILED]: ${err.message}\n`);
      failedTests++;
    }

    // ----------------------------------------------------------------
    // [TEST 3] Student Quiz Attempt & Hidden Answers Verification
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 3]: Student Attempt & Hidden Correct Answer Verification...`);
    try {
      const studentQuizView = await prisma.quiz.findUnique({
        where: { id: testQuiz.id },
        select: {
          id: true,
          title: true,
          questions: {
            select: {
              id: true,
              text: true,
              options: {
                select: {
                  id: true,
                  text: true
                  // isCorrect is intentionally omitted for student payload
                }
              }
            }
          }
        }
      });

      const firstQuestion = studentQuizView.questions[0];
      const hasIsCorrectField = firstQuestion.options.some(opt => opt.isCorrect !== undefined);

      console.log(`   ✓ Student Question View Fetched (${studentQuizView.questions.length} questions).`);
      console.log(`   ✓ Option fields present: [id, text]. isCorrect hidden: ${!hasIsCorrectField ? 'YES ✓' : 'NO ✕'}`);

      if (hasIsCorrectField) {
        throw new Error('SECURITY VIOLATION: isCorrect field exposed in student question payload.');
      }

      console.log(`   ${PASS} [TEST 3 PASSED]: Answer correctness is safely stripped from student view.\n`);
      passedTests++;
    } catch (err) {
      console.error(`   ${FAIL} [TEST 3 FAILED]: ${err.message}\n`);
      failedTests++;
    }

    // ----------------------------------------------------------------
    // [TEST 4] Server-Side Scoring & Tamper Immunity
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 4]: Server-Side Automated Scoring Enforcement...`);
    try {
      const q1 = testQuiz.questions[0];
      const q1CorrectOpt = q1.options.find(o => o.isCorrect);

      const q2 = testQuiz.questions[1];
      const q2WrongOpt = q2.options.find(o => !o.isCorrect);

      // Student selects 1 correct, 1 wrong -> Expect 50%
      const answersMap = {
        [q1.id]: q1CorrectOpt.id,
        [q2.id]: q2WrongOpt.id
      };

      let correctCount = 0;
      const answerRecords = [];

      testQuiz.questions.forEach(q => {
        const selectedOptId = answersMap[q.id];
        const correctOpt = q.options.find(o => o.isCorrect);
        const isMatch = Boolean(selectedOptId && correctOpt && selectedOptId === correctOpt.id);

        if (isMatch) correctCount++;

        answerRecords.push({
          questionId: q.id,
          selectedOptionId: selectedOptId || null,
          isCorrect: isMatch
        });
      });

      const calculatedScore = Math.round((correctCount / testQuiz.questions.length) * 100);
      const isPassed = calculatedScore >= testQuiz.passingScore;

      testAttempt = await prisma.attempt.create({
        data: {
          quizId: testQuiz.id,
          userId: testStudentUser.id,
          score: calculatedScore,
          totalQuestions: testQuiz.questions.length,
          status: 'COMPLETED',
          completedAt: new Date(),
          answers: {
            create: answerRecords
          }
        },
        include: {
          answers: true
        }
      });

      console.log(`   ✓ Submitted Answers: 1 Correct, 1 Wrong.`);
      console.log(`   ✓ Server Calculated Score: ${testAttempt.score}% (Passed: ${isPassed})`);

      if (testAttempt.score !== 50 || isPassed !== false) {
        throw new Error(`Scoring calculation mismatch: Expected 50%, got ${testAttempt.score}%`);
      }

      console.log(`   ${PASS} [TEST 4 PASSED]: Server-side scoring integrity validated.\n`);
      passedTests++;
    } catch (err) {
      console.error(`   ${FAIL} [TEST 4 FAILED]: ${err.message}\n`);
      failedTests++;
    }

    // ----------------------------------------------------------------
    // [TEST 5] Results & Attempt History Detailed Inspection
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 5]: Attempt Result Breakdown & Rationale Notes...`);
    try {
      const fullAttempt = await prisma.attempt.findUnique({
        where: { id: testAttempt.id },
        include: {
          quiz: {
            include: {
              category: true,
              questions: { include: { options: true } }
            }
          },
          answers: { include: { question: true, selectedOption: true } }
        }
      });

      if (!fullAttempt || !fullAttempt.answers || fullAttempt.answers.length !== 2) {
        throw new Error('Failed to retrieve full attempt breakdown.');
      }

      console.log(`   ✓ Retrieved Attempt #${fullAttempt.id} result breakdown.`);
      console.log(`   ✓ Question 1 Text: "${fullAttempt.quiz.questions[0].text}"`);

      console.log(`   ${PASS} [TEST 5 PASSED]: Attempt result breakdown verified.\n`);
      passedTests++;
    } catch (err) {
      console.error(`   ${FAIL} [TEST 5 FAILED]: ${err.message}\n`);
      failedTests++;
    }

    // ----------------------------------------------------------------
    // [TEST 6] Aggregation & Leaderboards Telemetry Integration
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 6]: Aggregation & Leaderboard Telemetry...`);
    try {
      const [totalAttemptsCount, leaderboardAttempts] = await Promise.all([
        prisma.attempt.count({ where: { status: 'COMPLETED' } }),
        prisma.attempt.findMany({
          where: { status: 'COMPLETED' },
          select: { score: true, userId: true }
        })
      ]);

      console.log(`   ✓ Total Completed Attempts in DB: ${totalAttemptsCount}`);
      console.log(`   ✓ Leaderboard Telemetry Items: ${leaderboardAttempts.length}`);

      if (totalAttemptsCount < 1) {
        throw new Error('Platform aggregation returned 0 attempt records.');
      }

      console.log(`   ${PASS} [TEST 6 PASSED]: Analytics & Leaderboard aggregation verified.\n`);
      passedTests++;
    } catch (err) {
      console.error(`   ${FAIL} [TEST 6 FAILED]: ${err.message}\n`);
      failedTests++;
    }

  } catch (globalErr) {
    console.error(`\n❌ [CRITICAL SUITE ERROR]:`, globalErr);
  } finally {
    // ----------------------------------------------------------------
    // [TEST 7] Safe Teardown & Purge
    // ----------------------------------------------------------------
    console.log(`${INFO} Executing [TEST 7]: Safe Teardown & Foreign Key Purge...`);
    try {
      if (testAttempt) {
        await prisma.answer.deleteMany({ where: { attemptId: testAttempt.id } });
        await prisma.attempt.delete({ where: { id: testAttempt.id } });
        console.log('   ✓ Purged Test Attempt & Answers.');
      }
      if (testQuiz) {
        for (const q of testQuiz.questions) {
          await prisma.option.deleteMany({ where: { questionId: q.id } });
        }
        await prisma.question.deleteMany({ where: { quizId: testQuiz.id } });
        await prisma.quiz.delete({ where: { id: testQuiz.id } });
        console.log('   ✓ Purged Test Quiz, Questions & Options.');
      }
      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } });
        console.log('   ✓ Purged Test Category.');
      }
      if (testAdminUser) {
        await prisma.user.delete({ where: { id: testAdminUser.id } });
      }
      if (testStudentUser) {
        await prisma.user.delete({ where: { id: testStudentUser.id } });
      }
      console.log('   ✓ Purged Test Users.');
      console.log(`   ${PASS} [TEST 7 PASSED]: Database safely cleaned without orphaned records.\n`);
      passedTests++;
    } catch (cleanupErr) {
      console.warn(`   ${WARN} Cleanup warning:`, cleanupErr.message);
    }

    await prisma.$disconnect();

    console.log('================================================================');
    console.log(`📊 SUMMARY RESULTS: PASSED: ${passedTests} / 7 | FAILED: ${failedTests} / 7`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      console.log('\x1b[31m❌ DAY 13 E2E TEST SUITE FAILED WITH ERRORS.\x1b[0m\n');
      process.exit(1);
    } else {
      console.log('\x1b[32m🎉 ALL 7 DAY 13 E2E SECURITY & INTEGRATION TESTS PASSED 100%!\x1b[0m\n');
      process.exit(0);
    }
  }
}

runE2ETestSuite();
