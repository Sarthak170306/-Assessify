const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

/**
 * Category Routes (/api/categories)
 */

// Read Categories (Accessible to authenticated users)
router.get('/', getAllCategories);

// Admin Mutation Routes (Require ADMIN Role)
router.post('/', requireAuth, requireRole('ADMIN'), createCategory);
router.put('/:id', requireAuth, requireRole('ADMIN'), updateCategory);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteCategory);

module.exports = router;
