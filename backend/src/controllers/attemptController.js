const prisma = require('../config/prisma');

/**
 * Quiz Attempt & Submission Controller (Express + Prisma)
 */

// 1. Submit Quiz Attempt and Perform Automated Server-Side Scoring
// POST /api/attempts/submit or POST /api/student/quizzes/:id/submit
const submitAttempt = async (req, res) => {
  try {
    const { quizId, timeSpentSeconds, answers } = req.body;
    const targetQuizId = quizId || req.params.id;

    if (!targetQuizId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'quizId is required for submission.'
      });
    }

    // 1. Fetch Quiz with Questions and Option Correctness
    const quiz = await prisma.quiz.findUnique({
      where: { id: targetQuizId },
      include: {
        category: { select: { id: true, name: true } },
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Quiz with ID '${targetQuizId}' not found.`
      });
    }

    // 2. Resolve Student User Identity
    let userId = req.dbUser?.id;

    if (!userId && (req.auth?.userId || req.headers['x-clerk-user-id'])) {
      const clerkId = req.auth?.userId || req.headers['x-clerk-user-id'];
      const dbUser = await prisma.user.findFirst({
        where: { OR: [{ clerkId }, { id: clerkId }] }
      });
      if (dbUser) userId = dbUser.id;
    }

    // Fallback in dev: find any user or active student/admin
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
      }) || await prisma.user.findFirst();
      
      if (fallbackUser) {
        userId = fallbackUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            clerkId: 'dev_student_user',
            email: 'student@assessify.ai',
            name: 'Student User',
            role: 'STUDENT',
            status: 'ACTIVE'
          }
        });
        userId = newUser.id;
      }
    }

    // 3. Automated Server-Side Scoring Algorithm
    const userAnswersMap = answers || {}; // { [questionId]: selectedOptionId }
    let correctAnswersCount = 0;
    const totalQuestions = quiz.questions.length;
    const answerRecordsToCreate = [];

    quiz.questions.forEach((question) => {
      const selectedOptionId = userAnswersMap[question.id] || null;
      let isAnswerCorrect = false;

      if (selectedOptionId) {
        const matchingOption = question.options.find((opt) => opt.id === selectedOptionId);
        if (matchingOption && matchingOption.isCorrect) {
          isAnswerCorrect = true;
          correctAnswersCount += 1;
        }
      }

      answerRecordsToCreate.push({
        questionId: question.id,
        selectedOptionId: selectedOptionId || null,
        isCorrect: isAnswerCorrect
      });
    });

    // Calculate score percentage
    const scorePercentage = totalQuestions > 0 
      ? Math.round((correctAnswersCount / totalQuestions) * 100) 
      : 0;

    const passed = scorePercentage >= quiz.passingScore;

    // 4. Create Transaction Safe Attempt & Answers in Prisma DB
    const attempt = await prisma.$transaction(async (tx) => {
      const newAttempt = await tx.attempt.create({
        data: {
          quizId: targetQuizId,
          userId,
          score: scorePercentage,
          totalQuestions,
          status: 'COMPLETED',
          completedAt: new Date(),
          answers: {
            create: answerRecordsToCreate
          }
        },
        include: {
          answers: true,
          quiz: { select: { title: true, passingScore: true, timeLimit: true } }
        }
      });
      return newAttempt;
    });

    return res.status(200).json({
      success: true,
      message: 'Assessment submitted and scored successfully.',
      result: {
        attemptId: attempt.id,
        quizId: targetQuizId,
        quizTitle: quiz.title,
        categoryName: quiz.category?.name || 'General Domain',
        score: scorePercentage,
        passingScore: quiz.passingScore,
        passed,
        totalQuestions,
        correctAnswers: correctAnswersCount,
        incorrectAnswers: totalQuestions - correctAnswersCount,
        timeSpentSeconds: timeSpentSeconds || 0,
        completedAt: attempt.completedAt
      }
    });
  } catch (err) {
    console.error('submitAttempt error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to evaluate and submit quiz attempt.',
      details: err.message
    });
  }
};

// 2. Get User Attempt History (GET /api/attempts/history or GET /api/student/history)
const getAttemptHistory = async (req, res) => {
  try {
    let userId = req.dbUser?.id;

    if (!userId && (req.auth?.userId || req.headers['x-clerk-user-id'])) {
      const clerkId = req.auth?.userId || req.headers['x-clerk-user-id'];
      const dbUser = await prisma.user.findFirst({
        where: { OR: [{ clerkId }, { id: clerkId }] }
      });
      if (dbUser) userId = dbUser.id;
    }

    const where = {};
    if (userId) {
      where.userId = userId;
    }

    const attempts = await prisma.attempt.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimit: true,
            category: { select: { name: true } }
          }
        }
      }
    });

    const formatted = attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz?.title || 'Assessment Quiz',
      categoryName: a.quiz?.category?.name || 'Uncategorized',
      score: a.score,
      passingScore: a.quiz?.passingScore || 70,
      passed: a.score >= (a.quiz?.passingScore || 70),
      totalQuestions: a.totalQuestions,
      status: a.status,
      completedAt: a.completedAt || a.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      attempts: formatted
    });
  } catch (err) {
    console.error('getAttemptHistory error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch attempt history.',
      details: err.message
    });
  }
};

// 3. Get Attempt Result Details by ID (GET /api/attempts/:attemptId)
const getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            category: { select: { id: true, name: true } },
            questions: {
              orderBy: { createdAt: 'asc' },
              include: {
                options: { orderBy: { createdAt: 'asc' } }
              }
            }
          }
        },
        answers: {
          include: {
            question: true,
            selectedOption: true
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Attempt with ID '${attemptId}' not found.`
      });
    }

    const quiz = attempt.quiz;
    const userAnswersMap = {};
    attempt.answers.forEach((ans) => {
      userAnswersMap[ans.questionId] = {
        selectedOptionId: ans.selectedOptionId,
        isCorrect: ans.isCorrect
      };
    });

    let correctCount = 0;
    const questionsBreakdown = (quiz.questions || []).map((q) => {
      const userAns = userAnswersMap[q.id] || {};
      const selectedOptionId = userAns.selectedOptionId || null;
      const correctOption = q.options.find((opt) => opt.isCorrect);

      const isUserCorrect = Boolean(
        selectedOptionId && correctOption && selectedOptionId === correctOption.id
      );

      if (isUserCorrect) correctCount += 1;

      return {
        id: q.id,
        text: q.text,
        points: q.points,
        explanation: q.explanation || 'Review correct answer selection and options.',
        selectedOptionId,
        correctOptionId: correctOption ? correctOption.id : null,
        isCorrect: isUserCorrect,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      };
    });

    const totalQuestions = attempt.totalQuestions || questionsBreakdown.length;
    const score = attempt.score;
    const passingScore = quiz.passingScore || 70;
    const passed = score >= passingScore;

    return res.status(200).json({
      success: true,
      attempt: {
        id: attempt.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizDescription: quiz.description,
        timeLimit: quiz.timeLimit,
        categoryName: quiz.category?.name || 'General Domain',
        score,
        passingScore,
        passed,
        totalQuestions,
        correctCount,
        incorrectCount: totalQuestions - correctCount,
        status: attempt.status,
        completedAt: attempt.completedAt || attempt.createdAt,
        questions: questionsBreakdown
      }
    });
  } catch (err) {
    console.error('getAttemptById error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch attempt result breakdown.',
      details: err.message
    });
  }
};

module.exports = {
  submitAttempt,
  getAttemptHistory,
  getAttemptById
};
