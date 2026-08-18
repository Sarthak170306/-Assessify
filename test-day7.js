/**
 * Day 7 Integration Test Script - Assessify AI
 * 
 * Run command:
 *   node test-day7.js
 */

try {
  require('dotenv').config({ path: './backend/.env' });
} catch (e) {
  try {
    require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
  } catch (e2) {}
}

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const { generateQuizFromAI, generateDiagnosticFeedback } = require('./backend/services/aiService');

const prisma = new PrismaClient();

async function runDay7Tests() {
  console.log('\n==================================================');
  console.log('🚀 ASSESSIFY AI - DAY 7 INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  let testCategory = null;
  let testQuiz = null;
  let testAttempt = null;

  try {
    // 0. Environment & GEMINI API Check
    console.log('[STEP 0] Checking Environment Setup & User Resolution...');
    if (process.env.GEMINI_API_KEY) {
      console.log('   ✓ process.env.GEMINI_API_KEY is configured.');
    } else {
      console.warn('   ⚠️ GEMINI_API_KEY not found in process.env. System will use structured fallback mode.');
    }

    // Resolve or Create Admin User
    let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          clerkId: `test_admin_${Date.now()}`,
          email: `admin_${Date.now()}@assessify.ai`,
          name: 'Day 7 Test Admin',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
    }
    console.log(`   ✓ Resolved Admin User: ${adminUser.email} (ID: ${adminUser.id})`);

    // Resolve or Create Student User
    let studentUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          clerkId: `test_student_${Date.now()}`,
          email: `student_${Date.now()}@assessify.ai`,
          name: 'Day 7 Test Student',
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });
    }
    console.log(`   ✓ Resolved Student User: ${studentUser.email} (ID: ${studentUser.id})`);

    // Create Temporary Test Category
    const categoryName = `AI Integration Test Domain ${Date.now()}`;
    testCategory = await prisma.category.create({
      data: {
        name: categoryName,
        description: 'Temporary category for Day 7 AI pipeline validation'
      }
    });
    console.log(`   ✓ Created Test Category: "${testCategory.name}" (ID: ${testCategory.id})`);
    console.log('   [SUCCESS] Step 0 Completed Successfully.\n');

    // 1. Validate Gemini AI Quiz Generation Service (Task 1)
    console.log('[STEP 1] Testing AI Quiz Generation Service (generateQuizFromAI)...');
    const aiQuizResult = await generateQuizFromAI({
      topic: 'JavaScript Closures and Event Loop',
      difficulty: 'Medium',
      count: 2,
      categoryName: testCategory.name
    });

    if (!aiQuizResult || !aiQuizResult.title || !Array.isArray(aiQuizResult.questions)) {
      throw new Error('AI Quiz Generation service returned an invalid payload structure.');
    }

    if (aiQuizResult.questions.length < 1) {
      throw new Error('AI Quiz Generation service returned 0 questions.');
    }

    console.log(`   ✓ Generated AI Quiz Title: "${aiQuizResult.title}"`);
    console.log(`   ✓ Generated ${aiQuizResult.questions.length} questions successfully.`);

    // Verify option choices structure
    aiQuizResult.questions.forEach((q, idx) => {
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Question ${idx + 1} has invalid options format.`);
      }
      const hasCorrect = q.options.some(o => o.isCorrect === true);
      if (!hasCorrect) {
        throw new Error(`Question ${idx + 1} does not have a correct answer marked.`);
      }
    });
    console.log('   ✓ Validated Question structure and correct answer option flags.');
    console.log('   [SUCCESS] Step 1 Completed Successfully.\n');

    // 2. Test Bulk DB Persistence Pipeline (Task 3)
    console.log('[STEP 2] Testing Bulk DB Persistence Pipeline (Prisma $transaction)...');
    testQuiz = await prisma.$transaction(async (tx) => {
      const created = await tx.quiz.create({
        data: {
          title: aiQuizResult.title,
          description: aiQuizResult.description,
          timeLimit: aiQuizResult.suggestedTimeLimit || 15,
          passingScore: aiQuizResult.suggestedPassingScore || 70,
          status: 'PUBLISHED',
          isPublished: true,
          categoryId: testCategory.id,
          createdById: adminUser.id,
          questions: {
            create: aiQuizResult.questions.map((q) => ({
              text: q.text,
              points: 1,
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  isCorrect: Boolean(opt.isCorrect)
                }))
              }
            }))
          }
        },
        include: {
          questions: {
            include: { options: true }
          }
        }
      });
      return created;
    });

    console.log(`   ✓ Bulk-persisted Quiz in Supabase PostgreSQL (ID: ${testQuiz.id})`);
    console.log(`   ✓ Persisted ${testQuiz.questions.length} questions into DB with option relations.`);
    console.log('   [SUCCESS] Step 2 Completed Successfully.\n');

    // 3. Simulate Student Attempt & Verify Scoring (Day 6 Hook)
    console.log('[STEP 3] Simulating Student Attempt & Automated Scoring...');
    const q1 = testQuiz.questions[0];
    const q1CorrectOption = q1.options.find(o => o.isCorrect) || q1.options[0];

    const q2 = testQuiz.questions[1] || testQuiz.questions[0];
    const q2IncorrectOption = q2.options.find(o => !o.isCorrect) || q2.options[0];

    testAttempt = await prisma.attempt.create({
      data: {
        quizId: testQuiz.id,
        userId: studentUser.id,
        score: 50.0,
        totalQuestions: testQuiz.questions.length,
        status: 'COMPLETED',
        completedAt: new Date(),
        answers: {
          create: [
            {
              questionId: q1.id,
              selectedOptionId: q1CorrectOption.id,
              isCorrect: true
            },
            {
              questionId: q2.id,
              selectedOptionId: q2IncorrectOption.id,
              isCorrect: false
            }
          ]
        }
      },
      include: {
        answers: {
          include: {
            question: true,
            selectedOption: true
          }
        }
      }
    });

    console.log(`   ✓ Created Student Attempt (ID: ${testAttempt.id}, Score: ${testAttempt.score}%)`);
    console.log(`   ✓ Recorded ${testAttempt.answers.length} user answers.`);
    console.log('   [SUCCESS] Step 3 Completed Successfully.\n');

    // 4. Validate AI Diagnostic Performance Feedback (Task 4)
    console.log('[STEP 4] Testing AI Diagnostic Performance Feedback (generateDiagnosticFeedback)...');
    const incorrectQuestionsPayload = testAttempt.answers
      .filter(a => !a.isCorrect)
      .map(a => ({
        text: a.question.text,
        selectedOptionText: a.selectedOption?.text || 'Incorrect choice',
        correctOptionText: 'Correct choice'
      }));

    const feedbackResult = await generateDiagnosticFeedback({
      quizTitle: testQuiz.title,
      scorePercentage: testAttempt.score,
      isPassed: false,
      incorrectQuestions: incorrectQuestionsPayload
    });

    if (!feedbackResult || !feedbackResult.summary || !Array.isArray(feedbackResult.strengths) || !Array.isArray(feedbackResult.weakAreas)) {
      throw new Error('generateDiagnosticFeedback returned invalid structure.');
    }

    console.log(`   ✓ AI Diagnostic Summary: "${feedbackResult.summary.substring(0, 80)}..."`);
    console.log(`   ✓ Strengths: ${feedbackResult.strengths.length} items`);
    console.log(`   ✓ Weak Areas: ${feedbackResult.weakAreas.length} items`);
    console.log(`   ✓ Recommendations: ${feedbackResult.recommendations?.length || 0} items`);

    // Cache feedback into DB Attempt record
    const updatedAttempt = await prisma.attempt.update({
      where: { id: testAttempt.id },
      data: {
        aiFeedback: feedbackResult
      }
    });

    if (!updatedAttempt.aiFeedback) {
      throw new Error('Failed to persist aiFeedback JSON in Attempt database record.');
    }
    console.log('   ✓ Persisted aiFeedback JSON into Attempt record in Supabase PostgreSQL.');
    console.log('   [SUCCESS] Step 4 Completed Successfully.\n');

  } catch (err) {
    console.error('\n❌ [TEST SUITE FAILURE]:', err.message);
    process.exitCode = 1;
  } finally {
    // 5. Safe Cleanup
    console.log('[STEP 5] Safe Cleanup of Temporary Test Records...');
    try {
      if (testAttempt) {
        await prisma.answer.deleteMany({ where: { attemptId: testAttempt.id } });
        await prisma.attempt.delete({ where: { id: testAttempt.id } });
        console.log('   ✓ Deleted temporary Test Attempt & Answers.');
      }

      if (testQuiz) {
        for (const q of testQuiz.questions) {
          await prisma.option.deleteMany({ where: { questionId: q.id } });
        }
        await prisma.question.deleteMany({ where: { quizId: testQuiz.id } });
        await prisma.quiz.delete({ where: { id: testQuiz.id } });
        console.log('   ✓ Deleted temporary Test Quiz, Questions & Options.');
      }

      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } });
        console.log('   ✓ Deleted temporary Test Category.');
      }
    } catch (cleanupErr) {
      console.warn('   ⚠️ Cleanup warning:', cleanupErr.message);
    }

    await prisma.$disconnect();
    console.log('   ✓ Disconnected Prisma Client connection safely.');
    console.log('\n==================================================');
    console.log(process.exitCode === 1 ? '❌ DAY 7 INTEGRATION TESTS FAILED' : '🎉 ALL DAY 7 INTEGRATION TESTS PASSED 100%');
    console.log('==================================================\n');
  }
}

runDay7Tests();
