import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Collection description is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Collection slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  image: {
    url: String,
    alt: String
  },
  bannerImage: {
    url: String,
    alt: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  seoTitle: {
    type: String,
    trim: true
  },
  seoDescription: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add text index for search functionality
collectionSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate slug if not provided
collectionSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Method to get collection with product count
collectionSchema.methods.getWithProductCount = async function() {
  const Product = mongoose.model('Product');
  const productCount = await Product.countDocuments({ collections: this._id });
  return {
    ...this.toObject(),
    productCount
  };
};

const Collection = mongoose.models.Collection || mongoose.model('Collection', collectionSchema);

export default Collection;
