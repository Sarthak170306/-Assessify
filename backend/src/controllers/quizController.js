const prisma = require('../config/prisma');

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

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz
};
