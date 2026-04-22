const { body } = require('express-validator');

const ALLOWED_CATEGORIES = ['Packaging', 'Bottles', 'Apparel', 'Beverage', 'Other'];

const createMockupValidator = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 chars'),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('price').exists().withMessage('Price is required').bail().isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('category').optional().isIn(ALLOWED_CATEGORIES).withMessage(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`),
];

const updateMockupValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(ALLOWED_CATEGORIES),
];

module.exports = { createMockupValidator, updateMockupValidator, ALLOWED_CATEGORIES };
