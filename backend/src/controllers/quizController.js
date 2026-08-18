const prisma = require('../config/prisma');
const { generateQuizFromAI } = require('../../services/aiService');

/**
 * Quiz CRUD Controller (Express + Prisma)
 */

// 1. Create a new Quiz (POST /api/quizzes)
const createQuiz = async (req, res) => {
  try {
    const { title, description, categoryId, timeLimit, passingScore, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Quiz title is required.'
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Quiz categoryId is required.'
      });
    }

    // Verify Category exists in database
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!categoryExists) {
      return res.status(400).json({
        error: 'BadRequest',
        message: `Category with ID '${categoryId}' does not exist.`
      });
    }

    // Resolve Creator User ID
    let creatorId = req.dbUser?.id;

    if (!creatorId && (req.auth?.userId || req.headers['x-clerk-user-id'])) {
      const clerkId = req.auth?.userId || req.headers['x-clerk-user-id'];
      const dbUser = await prisma.user.findFirst({
        where: { OR: [{ clerkId }, { id: clerkId }] }
      });
      if (dbUser) creatorId = dbUser.id;
    }

    // Fallback: If no user identity found in dev, find or create admin
    if (!creatorId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      if (fallbackUser) {
        creatorId = fallbackUser.id;
      } else {
        const newAdmin = await prisma.user.create({
          data: {
            clerkId: 'dev_admin_user',
            email: 'admin@assessify.ai',
            name: 'System Admin',
            role: 'ADMIN',
            status: 'ACTIVE'
          }
        });
        creatorId = newAdmin.id;
      }
    }

    const quizStatus = status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase()) 
      ? status.toUpperCase() 
      : 'DRAFT';

    const isPublished = quizStatus === 'PUBLISHED';

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        categoryId,
        createdById: creatorId,
        timeLimit: timeLimit ? parseInt(timeLimit, 10) : 30,
        passingScore: passingScore ? parseInt(passingScore, 10) : 70,
        status: quizStatus,
        isPublished
      },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { questions: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz created successfully.',
      quiz: {
        ...quiz,
        categoryName: quiz.category?.name || 'Uncategorized',
        totalQuestions: quiz._count?.questions || 0
      }
    });
  } catch (err) {
    console.error('createQuiz error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create quiz.',
      details: err.message
    });
  }
};

// 2. Retrieve All Quizzes (GET /api/quizzes)
const getAllQuizzes = async (req, res) => {
  try {
    const { status, categoryId, search } = req.query;

    const where = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const rawQuizzes = await prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { questions: true, attempts: true } }
      }
    });

    const quizzes = rawQuizzes.map((q) => ({
      ...q,
      categoryName: q.category?.name || 'Uncategorized',
      totalQuestions: q._count?.questions || 0,
      totalAttempts: q._count?.attempts || 0
    }));

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (err) {
    console.error('getAllQuizzes error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch quizzes.',
      details: err.message
    });
  }
};

// 3. Retrieve Quiz By ID (GET /api/quizzes/:id)
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        createdBy: { select: { id: true, email: true, name: true } },
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: { orderBy: { createdAt: 'asc' } }
          }
        },
        _count: { select: { attempts: true } }
      }
    });

    if (!quiz) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Quiz with ID '${id}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      quiz: {
        ...quiz,
        categoryName: quiz.category?.name || 'Uncategorized',
        totalQuestions: quiz.questions?.length || 0,
        totalAttempts: quiz._count?.attempts || 0
      }
    });
  } catch (err) {
    console.error('getQuizById error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch quiz details.',
      details: err.message
    });
  }
};

// 4. Update Quiz (PUT /api/quizzes/:id)
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, timeLimit, passingScore, status, isPublished } = req.body;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!existingQuiz) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Quiz with ID '${id}' not found.`
      });
    }

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!categoryExists) {
        return res.status(400).json({
          error: 'BadRequest',
          message: `Category with ID '${categoryId}' does not exist.`
        });
      }
    }

    let updatedStatus = existingQuiz.status;
    let updatedIsPublished = existingQuiz.isPublished;

    if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase())) {
      updatedStatus = status.toUpperCase();
      updatedIsPublished = updatedStatus === 'PUBLISHED';
    } else if (typeof isPublished === 'boolean') {
      updatedIsPublished = isPublished;
      updatedStatus = isPublished ? 'PUBLISHED' : 'DRAFT';
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(timeLimit !== undefined ? { timeLimit: parseInt(timeLimit, 10) } : {}),
        ...(passingScore !== undefined ? { passingScore: parseInt(passingScore, 10) } : {}),
        status: updatedStatus,
        isPublished: updatedIsPublished
      },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true, name: true } },
        _count: { select: { questions: true, attempts: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Quiz updated successfully.',
      quiz: {
        ...updatedQuiz,
        categoryName: updatedQuiz.category?.name || 'Uncategorized',
        totalQuestions: updatedQuiz._count?.questions || 0,
        totalAttempts: updatedQuiz._count?.attempts || 0
      }
    });
  } catch (err) {
    console.error('updateQuiz error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update quiz.',
      details: err.message
    });
  }
};

// 5. Delete Quiz (DELETE /api/quizzes/:id)
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!existingQuiz) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Quiz with ID '${id}' not found.`
      });
    }

    await prisma.quiz.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.',
      id
    });
  } catch (err) {
    console.error('deleteQuiz error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete quiz.',
      details: err.message
    });
  }
};

// 6. Retrieve Published Student Quizzes Catalog (GET /api/student/quizzes)
const getStudentQuizzes = async (req, res) => {
  try {
    const { category, categoryId, search } = req.query;

    const targetCategory = category || categoryId;

    const where = {
      status: 'PUBLISHED'
    };

    if (targetCategory) {
      where.categoryId = targetCategory;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const rawQuizzes = await prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { questions: true } }
      }
    });

    const quizzes = rawQuizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      timeLimit: q.timeLimit,
      passingScore: q.passingScore,
      status: q.status,
      category: q.category ? { id: q.category.id, name: q.category.name } : null,
      categoryName: q.category?.name || 'Uncategorized',
      totalQuestions: q._count?.questions || 0,
      createdAt: q.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (err) {
    console.error('getStudentQuizzes error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch student quiz catalog.',
      details: err.message
    });
  }
};

// 7. Retrieve Published Student Quiz Details for Pre-start Screen (GET /api/student/quizzes/:id)
const getStudentQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        _count: { select: { questions: true } }
      }
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Assessment quiz not found or is not currently available for student attempts.'
      });
    }

    return res.status(200).json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        status: quiz.status,
        category: quiz.category ? { id: quiz.category.id, name: quiz.category.name } : null,
        categoryName: quiz.category?.name || 'Uncategorized',
        totalQuestions: quiz._count?.questions || 0,
        createdAt: quiz.createdAt
      }
    });
  } catch (err) {
    console.error('getStudentQuizById error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch assessment details.',
      details: err.message
    });
  }
};

// 8. Retrieve Student Quiz Questions for Live Test Engine (GET /api/student/quizzes/:id/questions)
const getStudentQuizQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                text: true
              }
            }
          }
        }
      }
    });

    if (!quiz || quiz.status !== 'PUBLISHED') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Assessment quiz not found or is not currently available.'
      });
    }

    return res.status(200).json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        categoryName: quiz.category?.name || 'Uncategorized',
        totalQuestions: quiz.questions.length
      },
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        points: q.points,
        options: q.options
      }))
    });
  } catch (err) {
    console.error('getStudentQuizQuestions error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch assessment questions.',
      details: err.message
    });
  }
};

// 9. Generate AI Quiz Preview (POST /api/quizzes/generate-ai)
const generateAIQuiz = async (req, res) => {
  try {
    const { topic, categoryId, categoryName, difficulty, count } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Topic or subject matter is required for AI generation.'
      });
    }

    let targetCategoryName = categoryName || 'General';
    let targetCategoryId = categoryId || '';

    if (categoryId) {
      try {
        const categoryObj = await prisma.category.findUnique({
          where: { id: categoryId }
        });
        if (categoryObj) {
          targetCategoryName = categoryObj.name;
        }
      } catch (e) {}
    }

    const aiResult = await generateQuizFromAI({
      topic: topic.trim(),
      difficulty: difficulty || 'Medium',
      count: parseInt(count, 10) || 5,
      categoryName: targetCategoryName
    });

    const previewQuiz = {
      title: aiResult.title,
      description: aiResult.description,
      timeLimit: aiResult.suggestedTimeLimit,
      passingScore: aiResult.suggestedPassingScore,
      categoryId: targetCategoryId,
      categoryName: targetCategoryName,
      questions: aiResult.questions
    };

    return res.status(200).json({
      success: true,
      message: 'AI Quiz generated successfully for preview & review.',
      previewQuiz,
      quiz: previewQuiz
    });
  } catch (err) {
    console.error('generateAIQuiz error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate quiz with AI.',
      details: err.message
    });
  }
};

// 10. Save AI Quiz Bulk Insert Pipeline (POST /api/quizzes/save-ai-quiz)
const saveAIQuiz = async (req, res) => {
  try {
    const { title, description, categoryId, timeLimit, passingScore, status, questions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Quiz title is required.'
      });
    }

    // 1. Resolve Category ID safely in Database
    let targetCategoryId = categoryId;
    if (targetCategoryId) {
      const catExists = await prisma.category.findUnique({
        where: { id: targetCategoryId }
      }).catch(() => null);

      if (!catExists) {
        targetCategoryId = null;
      }
    }

    if (!targetCategoryId) {
      const firstCat = await prisma.category.findFirst().catch(() => null);
      if (firstCat) {
        targetCategoryId = firstCat.id;
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: 'General AI Domain',
            description: 'AI Generated Assessment Category'
          }
        }).catch(() => null);

        if (newCat) {
          targetCategoryId = newCat.id;
        }
      }
    }

    // 2. Resolve Creator User ID safely in Database
    let creatorId = req.dbUser?.id;

    if (!creatorId && (req.auth?.userId || req.headers['x-clerk-user-id'])) {
      const clerkId = req.auth?.userId || req.headers['x-clerk-user-id'];
      const dbUser = await prisma.user.findFirst({
        where: { OR: [{ clerkId }, { id: clerkId }] }
      }).catch(() => null);

      if (dbUser) {
        creatorId = dbUser.id;
      }
    }

    if (!creatorId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      }).catch(() => null);

      if (adminUser) {
        creatorId = adminUser.id;
      } else {
        const anyUser = await prisma.user.findFirst().catch(() => null);
        if (anyUser) {
          creatorId = anyUser.id;
        } else {
          const newAdmin = await prisma.user.create({
            data: {
              clerkId: 'dev_ai_admin',
              email: 'aiadmin@assessify.ai',
              name: 'System Admin',
              role: 'ADMIN',
              status: 'ACTIVE'
            }
          }).catch(() => null);

          if (newAdmin) {
            creatorId = newAdmin.id;
          }
        }
      }
    }

    const quizStatus = status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase()) 
      ? status.toUpperCase() 
      : 'DRAFT';

    const isPublished = quizStatus === 'PUBLISHED';
    const questionsArray = Array.isArray(questions) ? questions : [];

    // 3. Create Quiz with nested Questions and Options using Prisma transaction
    const createdQuiz = await prisma.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          timeLimit: timeLimit ? parseInt(timeLimit, 10) : 15,
          passingScore: passingScore ? parseInt(passingScore, 10) : 70,
          status: quizStatus,
          isPublished,
          categoryId: targetCategoryId,
          createdById: creatorId,
          questions: {
            create: questionsArray.map((q, qIndex) => {
              const options = Array.isArray(q.options) ? q.options : [];
              return {
                text: q.text || q.questionText || `Question ${qIndex + 1}`,
                points: Number(q.points) || 1,
                options: {
                  create: options.map((opt) => ({
                    text: opt.text || opt.optionText || '',
                    isCorrect: Boolean(opt.isCorrect)
                  }))
                }
              };
            })
          }
        },
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, email: true, name: true } },
          questions: {
            include: { options: true }
          }
        }
      });
      return newQuiz;
    });

    return res.status(201).json({
      success: true,
      message: 'AI Quiz persisted successfully.',
      quizId: createdQuiz.id,
      quiz: {
        ...createdQuiz,
        categoryName: createdQuiz.category?.name || 'General Domain',
        totalQuestions: createdQuiz.questions?.length || questionsArray.length
      }
    });
  } catch (err) {
    console.error('saveAIQuiz error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to bulk-save AI quiz into database.',
      details: err.message
    });
  }
};

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getStudentQuizzes,
  getStudentQuizById,
  getStudentQuizQuestions,
  generateAIQuiz,
  saveAIQuiz
};
