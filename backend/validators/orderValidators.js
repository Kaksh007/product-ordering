const { body } = require('express-validator');
const Order = require('../models/Order');

const createOrderValidator = [
  body('mockupId').isMongoId().withMessage('Valid mockupId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('notes').optional().isString().isLength({ max: 1000 }),
];

const updateOrderStatusValidator = [
  body('status').isIn(Order.STATUSES).withMessage(`Status must be one of: ${Order.STATUSES.join(', ')}`),
];

module.exports = { createOrderValidator, updateOrderStatusValidator };
