const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createMockupValidator, updateMockupValidator } = require('../validators/mockupValidators');

const {
  listMockups,
  getMockup,
  createMockup,
  updateMockup,
  deleteMockup,
} = require('../controllers/mockupController');

router.use(protect);

router.route('/')
  .get(listMockups)
  .post(authorize('designer'), upload.single('image'), createMockupValidator, validate, createMockup);

router.route('/:id')
  .get(getMockup)
  .put(authorize('designer'), upload.single('image'), updateMockupValidator, validate, updateMockup)
  .delete(authorize('designer'), deleteMockup);

module.exports = router;
