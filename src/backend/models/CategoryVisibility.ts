import mongoose from 'mongoose';

const categoryVisibilitySchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'tshirts',
        'jerseys',
        'tanktops',
        'longsleeve',
        'hoodies',
        'sweatshirts',
        'sweatpants',
        'accessories',
        'shortsleeve'
      ],
      message: '{VALUE} is not a valid category'
    },
    unique: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required']
  },
  description: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  genderVisibility: {
    men: { type: Boolean, default: true },
    women: { type: Boolean, default: true },
    unisex: { type: Boolean, default: true },
    kids: { type: Boolean, default: true }
  },
  updatedBy: {
    type: String,
    required: [true, 'Admin user who updated this setting is required']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique category names
categoryVisibilitySchema.index({ category: 1 }, { unique: true });

// Method to toggle visibility
categoryVisibilitySchema.methods.toggleVisibility = function() {
  this.isVisible = !this.isVisible;
  return this.save();
};

// Method to update gender visibility
categoryVisibilitySchema.methods.updateGenderVisibility = function(gender: string, isVisible: boolean) {
  if (this.genderVisibility.hasOwnProperty(gender)) {
    this.genderVisibility[gender] = isVisible;
    return this.save();
  }
  throw new Error(`Invalid gender: ${gender}`);
};

const CategoryVisibility = mongoose.models.CategoryVisibility || mongoose.model('CategoryVisibility', categoryVisibilitySchema);

export default CategoryVisibility;
