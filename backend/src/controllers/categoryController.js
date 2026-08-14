const prisma = require('../config/prisma');

/**
 * Category CRUD Controller (Express + Prisma)
 */

// 1. Get All Categories (GET /api/categories)
const getAllCategories = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { quizzes: true } }
      }
    });

    const formattedCategories = categories.map(c => ({
      ...c,
      quizzesCount: c._count?.quizzes || 0
    }));

    return res.status(200).json({
      success: true,
      count: formattedCategories.length,
      categories: formattedCategories
    });
  } catch (err) {
    console.error('getAllCategories error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch categories.',
      details: err.message
    });
  }
};

// 2. Create Category (POST /api/categories)
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Category name is required.'
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return res.status(400).json({
        error: 'BadRequest',
        message: `Category with name '${name.trim()}' already exists.`
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      },
      include: {
        _count: { select: { quizzes: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: {
        ...category,
        quizzesCount: 0
      }
    });
  } catch (err) {
    console.error('createCategory error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create category.',
      details: err.message
    });
  }
};

// 3. Update Category (PUT /api/categories/:id)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Category with ID '${id}' not found.`
      });
    }

    if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicateName = await prisma.category.findUnique({
        where: { name: name.trim() }
      });
      if (duplicateName) {
        return res.status(400).json({
          error: 'BadRequest',
          message: `Category name '${name.trim()}' is already taken.`
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {})
      },
      include: {
        _count: { select: { quizzes: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category: {
        ...updatedCategory,
        quizzesCount: updatedCategory._count?.quizzes || 0
      }
    });
  } catch (err) {
    console.error('updateCategory error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update category.',
      details: err.message
    });
  }
};

// 4. Delete Category (DELETE /api/categories/:id)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { quizzes: true } } }
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Category with ID '${id}' not found.`
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
      id
    });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to delete category.',
      details: err.message
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
