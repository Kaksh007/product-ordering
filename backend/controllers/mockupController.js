const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const Mockup = require('../models/Mockup');
const Order = require('../models/Order');
const uploader = require('../middleware/upload');

// Build the publicly-addressable URL for a file depending on the storage backend.
const buildFileMeta = (req, file) => {
  if (uploader.strategy === 'cloudinary') {
    return { imageUrl: file.path, imagePublicId: file.filename };
  }
  // local storage: expose /uploads/<filename>
  const host = `${req.protocol}://${req.get('host')}`;
  return { imageUrl: `${host}/uploads/${file.filename}`, imagePublicId: '' };
};

// Delete the underlying image when a mockup is removed, so we don't leak storage.
const destroyImage = async (mockup) => {
  try {
    if (uploader.strategy === 'cloudinary' && mockup.imagePublicId) {
      await uploader.cloudinary.uploader.destroy(mockup.imagePublicId);
      return;
    }
    // local: derive path from URL
    const filename = mockup.imageUrl.split('/uploads/')[1];
    if (filename) {
      const full = path.join(__dirname, '..', 'uploads', filename);
      fs.promises.unlink(full).catch(() => {});
    }
  } catch (_) {
    // best-effort cleanup
  }
};

// GET /api/mockups
// Designers see their own; clients see everything.
const listMockups = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'designer') filter.designer = req.user._id;
  // Coerce user-supplied query param to a string so an object like { $ne: null }
  // can't reach Mongo as an operator. express-mongo-sanitize already strips keys
  // with '$' / '.', but defence in depth.
  if (req.query.category) filter.category = String(req.query.category);

  const mockups = await Mockup.find(filter)
    .populate('designer', 'name email role')
    .sort('-createdAt');

  res.json({ count: mockups.length, mockups });
});

// GET /api/mockups/:id
const getMockup = asyncHandler(async (req, res) => {
  const mockup = await Mockup.findById(req.params.id).populate('designer', 'name email role');
  if (!mockup) {
    res.status(404);
    throw new Error('Mockup not found');
  }
  // A designer can only fetch their own mockup detail; clients can view any mockup
  // (that's the catalogue they order from).
  if (req.user.role === 'designer' && String(mockup.designer._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only view your own mockups');
  }
  res.json({ mockup });
});

// POST /api/mockups  (designers only, multipart/form-data with `image`)
const createMockup = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('An image file is required');
  }
  const { name, description = '', price, category = 'Packaging' } = req.body;
  const meta = buildFileMeta(req, req.file);

  const mockup = await Mockup.create({
    name,
    description,
    price: Number(price),
    category,
    designer: req.user._id,
    ...meta,
  });

  res.status(201).json({ mockup });
});

// PUT /api/mockups/:id  (owning designer only)
const updateMockup = asyncHandler(async (req, res) => {
  const mockup = await Mockup.findById(req.params.id);
  if (!mockup) {
    res.status(404);
    throw new Error('Mockup not found');
  }
  if (String(mockup.designer) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own mockups');
  }

  ['name', 'description', 'price', 'category'].forEach((field) => {
    if (req.body[field] !== undefined) mockup[field] = req.body[field];
  });

  // optional new image
  if (req.file) {
    await destroyImage(mockup);
    const meta = buildFileMeta(req, req.file);
    mockup.imageUrl = meta.imageUrl;
    mockup.imagePublicId = meta.imagePublicId;
  }

  await mockup.save();
  res.json({ mockup });
});

// DELETE /api/mockups/:id  (owning designer only)
const deleteMockup = asyncHandler(async (req, res) => {
  const mockup = await Mockup.findById(req.params.id);
  if (!mockup) {
    res.status(404);
    throw new Error('Mockup not found');
  }
  if (String(mockup.designer) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own mockups');
  }

  const activeOrders = await Order.countDocuments({
    mockup: mockup._id,
    status: { $nin: ['completed', 'cancelled'] },
  });
  if (activeOrders > 0) {
    res.status(409);
    throw new Error('Cannot delete mockup with active orders');
  }

  await destroyImage(mockup);
  await mockup.deleteOne();
  res.json({ message: 'Mockup deleted' });
});

module.exports = {
  listMockups,
  getMockup,
  createMockup,
  updateMockup,
  deleteMockup,
};
