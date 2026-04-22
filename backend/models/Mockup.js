const mongoose = require('mongoose');

const mockupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mockup name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    category: {
      type: String,
      enum: ['Packaging', 'Bottles', 'Apparel', 'Beverage', 'Other'],
      default: 'Packaging',
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    imagePublicId: {
      // Used by Cloudinary for deletes; blank for local uploads
      type: String,
      default: '',
    },
    designer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mockup', mockupSchema);
