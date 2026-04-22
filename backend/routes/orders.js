const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderValidator, updateOrderStatusValidator } = require('../validators/orderValidators');

const {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getDesignerStats,
} = require('../controllers/orderController');

router.use(protect);

router.get('/stats', authorize('designer'), getDesignerStats);

router.route('/')
  .get(listOrders)
  .post(authorize('client'), createOrderValidator, validate, createOrder);

router.route('/:id')
  .get(getOrder)
  .delete(authorize('client'), cancelOrder);

router.patch('/:id/status', authorize('designer'), updateOrderStatusValidator, validate, updateOrderStatus);

module.exports = router;
