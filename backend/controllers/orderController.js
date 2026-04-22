const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Mockup = require('../models/Mockup');

// GET /api/orders
// - client: their own orders
// - designer: orders placed on their mockups
const listOrders = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'client') {
    filter.client = req.user._id;
  } else if (req.user.role === 'designer') {
    // find mockups owned by this designer, then orders against those
    const myMockups = await Mockup.find({ designer: req.user._id }).select('_id');
    filter.mockup = { $in: myMockups.map((m) => m._id) };
  }
  // Coerce to string — defence in depth against NoSQL operator injection.
  if (req.query.status) filter.status = String(req.query.status);

  const orders = await Order.find(filter)
    .populate('client', 'name email role')
    .populate({
      path: 'mockup',
      select: 'name imageUrl price category designer',
      populate: { path: 'designer', select: 'name email role' },
    })
    .sort('-createdAt');

  res.json({ count: orders.length, orders, serverTime: Date.now() });
});

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'name email role')
    .populate({
      path: 'mockup',
      select: 'name imageUrl price category designer',
      populate: { path: 'designer', select: 'name email role' },
    });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Permission: client must own it, designer must own the mockup
  const isClient = req.user.role === 'client' && String(order.client._id) === String(req.user._id);
  const isDesignerOwner =
    req.user.role === 'designer' && String(order.mockup.designer._id) === String(req.user._id);
  if (!isClient && !isDesignerOwner) {
    res.status(403);
    throw new Error('You do not have access to this order');
  }

  res.json({ order });
});

// POST /api/orders   (clients only)
const createOrder = asyncHandler(async (req, res) => {
  const { mockupId, quantity, notes = '' } = req.body;

  const mockup = await Mockup.findById(mockupId);
  if (!mockup) {
    res.status(404);
    throw new Error('Mockup not found');
  }

  const qty = Number(quantity);
  const unitPrice = Number(mockup.price);
  const order = await Order.create({
    client: req.user._id,
    mockup: mockup._id,
    quantity: qty,
    unitPrice,
    totalPrice: +(unitPrice * qty).toFixed(2),
    notes,
  });

  const populated = await order.populate([
    { path: 'client', select: 'name email role' },
    {
      path: 'mockup',
      select: 'name imageUrl price category designer',
      populate: { path: 'designer', select: 'name email role' },
    },
  ]);

  res.status(201).json({ order: populated });
});

// PATCH /api/orders/:id/status  (designer who owns the mockup)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate({
    path: 'mockup',
    select: 'designer',
  });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.mockup.designer) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the owning designer can change this order');
  }

  order.status = req.body.status;
  await order.save();

  const populated = await Order.findById(order._id)
    .populate('client', 'name email role')
    .populate({
      path: 'mockup',
      select: 'name imageUrl price category designer',
      populate: { path: 'designer', select: 'name email role' },
    });

  res.json({ order: populated });
});

// DELETE /api/orders/:id  (owning client, only if still pending)
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.client) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only cancel your own orders');
  }
  if (order.status !== 'pending') {
    res.status(409);
    throw new Error('Only pending orders can be cancelled by the client');
  }

  order.status = 'cancelled';
  await order.save();
  res.json({ order });
});

// GET /api/orders/stats  (designer dashboard metrics)
const getDesignerStats = asyncHandler(async (req, res) => {
  const myMockups = await Mockup.find({ designer: req.user._id }).select('_id');
  const ids = myMockups.map((m) => m._id);

  const [total, pending, completed] = await Promise.all([
    Order.countDocuments({ mockup: { $in: ids } }),
    Order.countDocuments({ mockup: { $in: ids }, status: { $in: ['pending', 'accepted', 'in_production', 'shipped'] } }),
    Order.countDocuments({ mockup: { $in: ids }, status: 'completed' }),
  ]);

  res.json({
    totalMockups: myMockups.length,
    ordersReceived: total,
    pendingOrders: pending,
    completedOrders: completed,
    successRate: total ? Math.round((completed / total) * 100) : 0,
  });
});

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getDesignerStats,
};
