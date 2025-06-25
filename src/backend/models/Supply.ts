import mongoose from 'mongoose';

const supplySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,  // This will store the image URL
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  minimumOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  supplier: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contactInfo: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Supply = mongoose.models.Supply || mongoose.model('Supply', supplySchema);

export default Supply; 